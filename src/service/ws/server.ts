import { v4 } from "uuid";
import { Logger } from "winston";
import WebSocket, { WebSocketServer } from "ws";
import { Payload, PayloadType } from "../../model/payload";
import { Util } from "../../util";
import { WSCallUser } from "./callUser";
import { WSUserStatus } from "./status";
import conf from "./../../conf";
import { PasswordChecker } from "./passwordChecker";
import { IncomingMessage } from "http";
import { UserDB } from "../../db/userDB";
import { WSCalleeAnswer } from "./callAnswer";
import { WSCallDenied } from "./callDenied";

export class AppWSServer {

    private connections: Map<string, WebSocket> = new Map();

    private util: Util = new Util();

    private id: string = v4();

    private logger: Logger = this.util.log({ application: conf["ws-app-name"] }, { uid: this.id });

    private userDBOperation: UserDB = new UserDB(this.logger);

    private sendMessageToUser = (connection: WebSocket, message: string): void => {
        connection.send(message);
    }

    private updateUserConnectionId = async (username: string, connectionId: string): Promise<void> => {
        this.userDBOperation.updateConnectionId(connectionId, username)
            .catch(err => {
                this.logger.child({ user: username, connectionid: connectionId, errMessage: err }).error('Failed in updating connection id to user')
            });
    }

    private deleteConnectionId = async (username: string): Promise<void> => {
        this.userDBOperation.deleteConnectionId(username)
            .catch(err => {
                this.logger.child({ user: username, errMessage: err }).error('Failed in updating connection id to user')
            });
    }
    
    private errorMessagePayload = (message: string, websocketConnection: WebSocket, err: any | undefined = undefined): void => {
        this.logger.child({ 'err': JSON.stringify(err), errMessage: message }).error('Error while Perfoming operation. Sending closing connection request to reciever')
        websocketConnection.send(JSON.stringify({
            type: PayloadType.error,
            message: message,
            recieverUserName: 'client',
            sendUser: {
                username: 'server'
            }
        }));
    }

    public createServer = (): void => {
        const wss = new WebSocketServer({
            port: conf["ws-port"],
            verifyClient: (info, cb) => {
                if (info.req.headers.from == undefined) {
                    cb(false, 400, 'Missing Header from');
                }
                if (info.req.headers.authorization != undefined) {
                    const base64Credentials = info.req.headers.authorization?.split(' ')[1];
                    const credentials = Buffer.from(base64Credentials, 'base64').toString('ascii');
                    const [username, password] = credentials.split(':');
                    new PasswordChecker(this.logger).validatePassword({
                        username: username,
                        password: password
                    })
                        .then(() => {
                            cb(true);
                        }).catch(err => {
                            this.logger.child({ errorMessage: err, user: username }).error('Invalid Authentication for user')
                            cb(false, 401, 'Unauthorized')
                        })
                }
                else {
                    cb(false, 401, 'Unauthorized')
                }
            },
        });

        wss.on('connection', async (websocketConnection: WebSocket, request: IncomingMessage) => {
            this.logger.info('Web Socket Connection Successfull !!!')
            const connectionId: string = v4();
            this.connections.set(connectionId, websocketConnection);
            await this.updateUserConnectionId(request.headers.from? request.headers.from: '', connectionId);
            websocketConnection.on('message',  (message: WebSocket.RawData) => {
                let payload: Payload | undefined;
                try {
                    payload = JSON.parse(Buffer.from(message as ArrayBuffer).toString());
                } catch (e) {
                    this.logger.error('Invalid Message payload recieved ' + e)
                }
                if (payload != undefined) {
                    switch (payload.type.toString()) {
                        case PayloadType[PayloadType.status]:
                            this.logger.child({ operation: payload.type, username: payload.sendUser.username, connectionId: connectionId }).info('Call change status to Online')
                            new WSUserStatus(websocketConnection, payload, this.logger).updateStatus();
                            break;

                        case PayloadType[PayloadType.offer]:
                            this.logger.child({ operation: payload.type, 'Callee': payload.recieverUserName, 'Caller': payload.sendUser.username }).info('Caller making call to Callee,')
                            new WSCallUser(websocketConnection, payload, this.logger, this.connections).call();
                            break;

                        case PayloadType[PayloadType.answer]:
                            this.logger.child({ operation: payload.type, 'Caller': payload.sendUser.username, 'Callee': payload.recieverUserName }).info('Callee answering call of caller')
                            new WSCalleeAnswer(websocketConnection, payload, this.logger, this.connections).answer();
                            break;

                        case PayloadType[PayloadType.denied]:
                            this.logger.child({ operation: payload.type, 'Caller': payload.recieverUserName, 'Callee': payload.sendUser }).info('Callee denied call of caller')
                            new WSCallDenied(websocketConnection, payload, this.logger, this.connections).callDenied();
                            break;

                        default:
                            this.logger.child({ operation: payload.type, username: payload.sendUser.username }).error(`Invalid operation = ${payload.type} recieved in message payload`)
                            websocketConnection.send(JSON.stringify({
                                type: 'error',
                                message: 'Invalid Operation'
                            }));
                            break;
                    }

                } else {
                    this.logger.error(`Invalid Payload recieved`)
                    this.errorMessagePayload('Invalid Payload recieved', websocketConnection);
                }

            });

            websocketConnection.on('close',async () => {
                await this.deleteConnectionId(request.headers.from? request.headers.from: '');
                this.connections.delete(this.id);
                this.logger.child({ type: 'summary' }).info(`Total User connected  ${this.connections.size}`)
                this.logger.info('Connection Closed to websocket !!!')
            });
        });
    }

}