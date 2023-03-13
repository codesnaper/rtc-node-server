import { v4 } from "uuid";
import { Logger } from "winston";
import WebSocket, { WebSocketServer } from "ws";
import { Payload, PayloadType } from "../../model/payload";
import { Util } from "../../util";
import { WSCallUser } from "./callUser";
import { WSStatus } from "./operation";
import conf from "./../../conf";
import { PayloadVerifier } from "./payloadVerifier";

export class AppWSServer {

    private connections: Map<string, WebSocket> = new Map();

    private util: Util = new Util();

    private id: string = v4();

    private logger: Logger = this.util.log({ application: conf["ws-app-name"] }, { uid: this.id });

    private sendMessageToUser = (connection: WebSocket, message: string): void => {
        connection.send(message);
    }

    private errorMessagePayload = (message: string, websocketConnection: WebSocket,  err: any| undefined = undefined): void => {
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
        });

        wss.on('connection', (websocketConnection: WebSocket) => {
            this.logger.info('Web Socket Connection Successfull !!!')
            websocketConnection.on('message', (message: WebSocket.RawData) => {
                let payload: Payload | undefined;
                try {
                    payload = JSON.parse(Buffer.from(message as ArrayBuffer).toString());
                } catch (e) {
                    this.logger.error('Invalid Message payload recieved ' + e)
                }
                if (payload != undefined) {
                    const payloadVerifier: PayloadVerifier = new PayloadVerifier(payload, this.logger);
                    payloadVerifier.payloadChecker()
                        .then(() => {
                            if (payload != undefined) {
                                switch (payload.type.toString()) {
                                    case PayloadType[PayloadType.online]:
                                        const connectionId: string = v4();
                                        this.logger.child({ operation: payload.type, username: payload.sendUser.username, connectionId: connectionId }).info('Call change status to Online')
                                        this.connections.set(connectionId, websocketConnection);
                                        new WSStatus(websocketConnection, payload, this.logger).userOnline(connectionId);
                                        break;

                                    case PayloadType[PayloadType.offline]:
                                        this.logger.child({ operation: payload.type, username: payload.sendUser.username, connectionId: payload.sendUser.connectionId }).info('Call change status to Offline')
                                        new WSStatus(websocketConnection, payload, this.logger).userOffline();
                                        if (payload.sendUser.connectionId) {
                                            this.connections.delete(payload.sendUser.connectionId);
                                        }
                                        break;

                                    case PayloadType[PayloadType.offer]:
                                        this.logger.child({ operation: payload.type, 'Callee': payload.recieverUserName, 'Caller': payload.sendUser.username }).info('Caller making call to Callee,')
                                        new WSCallUser(websocketConnection, payload, this.logger, this.connections).call();
                                        break;

                                    // //send answer object
                                    // case PayloadType.answer:
                                    //     logger.child({ operation: data.type, 'Caller': data.username, 'Callee': data.currentUser.username }).info('Callee answering call of caller')
                                    //     new WSCalleeAnswer(conn, this.connections, data, logger).answer();
                                    //     break;

                                    // case PayloadType.denied:
                                    //     logger.child({ operation: data.type, 'Caller': data.username, 'Callee': data.currentUser.username }).info('Callee denied call of caller')
                                    //     new WSCalleeDenied(conn, this.connections, data, logger).deny();
                                    //     break;

                                    default:
                                        this.logger.child({ operation: payload.type, username: payload.sendUser.username }).error(`Invalid operation = ${payload.type} recieved in message payload`)
                                        websocketConnection.send(JSON.stringify({
                                            type: 'error',
                                            message: 'Invalid Operation'
                                        }));
                                        break;
                                }
                            }
                        })
                        .catch((err) => {
                            this.logger.child({errorMessage: JSON.stringify(err)}).error(`Error in Payload verifier`)
                            this.errorMessagePayload(err, websocketConnection);
                            websocketConnection.close();
                        })

                } else {
                    this.logger.error(`Invalid Payload recieved`)
                    this.errorMessagePayload('Invalid Payload recieved', websocketConnection);
                }

            });

            websocketConnection.on('close', () => {
                this.connections.delete(this.id);
                this.logger.child({type: 'summary'}).info(`Total User connected  ${this.connections.size}`)
                this.logger.info('Connection Closed to websocket !!!')
            });
        });
    }

}