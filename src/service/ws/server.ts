import { v4 } from "uuid";
import { Logger } from "winston";
import WebSocket, { WebSocketServer } from "ws";
import { Payload, PayloadType } from "../../model/payload";
import { Util } from "../../util";
import { WSCallUser } from "./callUser";
import { WSUserStatus } from "./status";
import conf from "./../../conf";
import { IncomingMessage } from "http";
import { UserDB } from "../../db/userDB";
import { WSCalleeAnswer } from "./callAnswer";
import { WSCallDenied } from "./callDenied";
import { Token } from "../api/token.";
import { User } from "../../model/user";

export class AppWSServer {

    private connections: Map<string, WebSocket> = new Map();

    private util: Util = new Util();

    private id: string = v4();

    private logger: Logger = this.util.log({ application: conf["ws-app-name"] }, { uid: this.id });

    private userDBOperation: UserDB = new UserDB(this.logger);

    private token: Token = new Token(this.logger);

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

    private getToken = (token: string): Promise<User> => {
        return new Promise((resolve, reject) => {
            this.token.verifyToken(token)
                .then((user: User) => resolve(user))
                .catch((err) => reject(err));
        })
    }

    private closeSocket = (connection: WebSocket, user: User | undefined, connectionId: string) => {
        if(user){
            const deleteConnection  = this.userDBOperation.deleteConnectionId(user.username);
            const offlinePayload: object = {
                type: PayloadType.status,
                status: 'offline',
                sendUser: user,
                recieverUserName: 'server',
            }
            const offlineStatusPromise = new WSUserStatus(connection, offlinePayload as Payload, this.logger).updateStatus();
            Promise.all([deleteConnection, offlineStatusPromise])
            .then(() => {connection.close(200, 'Closing the connection')})
            .catch(() => connection.close(200, 'Closing the connection'));
        } else{
            this.connections.delete(this.id);
        }
        connection.close(200, 'Closing the connection');        
    }

    public createServer = (): void => {
        const wss = new WebSocketServer({
            port: conf["ws-port"],
            path: '/server',
            verifyClient: (info, cb) => {
                const url: URL = new URL(`http://localhost:8080${info.req.url}`);
                const tokenString: string | null = url.searchParams.get('token');
                if (tokenString) {
                    this.getToken(tokenString).then(() => {
                        cb(true);
                    }).catch((err) => {
                        this.logger.child({ errorMessage: err }).error('Invalid Authentication for user');
                        cb(false, 401, 'Unauthorized')
                    });
                }
                else {
                    cb(false, 400, 'Missing query param token')
                }
            },
        });

        wss.on('connection', (websocketConnection: WebSocket, request: IncomingMessage) => {
            const url: URL = new URL(`http://localhost:8080${request.url}`);
            const tokenString: string = `${url.searchParams.get('token')}`;
            this.token.verifyToken(tokenString)
                .then((user) => {
                    const connectionId: string = v4();
                    user.connectionId = connectionId;
                    this.logger.info(`Web Socket Connection Successfull for user ${user.username}!!!`)
                    const onlinePayload: object = {
                        type: PayloadType.status,
                        status: 'online',
                        sendUser: user,
                        recieverUserName: 'server',
                    }
                    const promiseStatus: Promise<any> = new WSUserStatus(websocketConnection, onlinePayload as Payload, this.logger).updateStatus();
                    const promiseConnectionIdUpdate: Promise<any> = this.userDBOperation.updateConnectionId(connectionId, user.username);
                    Promise.all([promiseStatus, promiseConnectionIdUpdate])
                        .then(() => {
                            this.connections.set(connectionId, websocketConnection);
                            websocketConnection.on('message', (message: WebSocket.RawData) => {
                                const payloadString: string = Buffer.from(message as ArrayBuffer).toString();
                                this.logger.info(`Recieve payload from user ${user.username}, payload data > ${payloadString}`)
                                let payload: Payload | undefined;
                                try {
                                    payload = JSON.parse(payloadString);
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

                            websocketConnection.on('close', () => {
                                this.closeSocket(websocketConnection, user, connectionId);
                            })
                        })
                        .catch((err) => {
                            this.logger.error('Closing socket connection due to error >' + err)
                            websocketConnection.close(500, err);
                            this.closeSocket(websocketConnection, user, connectionId);
                        })
                }).catch((err) => {
                    this.logger.error('Closing socket connection due to error >' + err)
                    websocketConnection.close(401, err);
                })
        });
    }

}