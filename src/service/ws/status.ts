import { Logger } from "winston";
import { WebSocket } from "ws";
import { UserDB } from "../../db/userDB";
import { Payload, PayloadType } from "../../model/payload";
import { UserStatus } from "../../model/statusEnum";
import { User } from "../../model/user";

export class WSUserStatus {

    private websocketConnection: WebSocket;

    private payload: Payload;

    private logger: Logger;

    private userDBOperation: UserDB;

    constructor(connection: WebSocket, payload: Payload, logger: Logger) {
        this.websocketConnection = connection;
        this.payload = payload;
        this.logger = logger;
        this.userDBOperation = new UserDB(logger);
    }


    private sendMessage = (payload: Payload): void => {
        this.logger.child({ payloadType: payload.type, recieverUser: payload.recieverUserName, senderUser: payload.sendUser.username }).debug(`Sending message to Reciever`)
        this.websocketConnection.send(JSON.stringify({
            type: PayloadType[payload.type],
            message: payload.message,
            status: payload.status,
            recieverUserName: payload.recieverUserName,
            sendUser: payload.sendUser
        }))
    }

    private errorMessagePayload = (message: string, err: any | undefined = undefined): void => {
        this.logger.child({ 'err': JSON.stringify(err), errMessage: message }).error('Error while Perfoming operation. Sending closing connection request to reciever')
        this.sendMessage({
            type: PayloadType.error,
            message: message,
            recieverUserName: this.payload.sendUser.username,
            sendUser: {
                username: 'server'
            }
        });
    }

    private updateUserStatus = (status: UserStatus): Promise<any> => {
        return new Promise((resolve, reject) => {
            this.userDBOperation.updateUserStatus(status, this.payload.sendUser.username)
                .then(() => resolve(true))
                .catch((err) => {
                    reject(err);
                });
        });
    }

    private getUserSuccessCallback = (user: User, status: UserStatus): Promise<any> => {
        return new Promise((resolve, reject) => {
            this.updateUserStatus(status)
                .then(() => {
                    user.status = status;
                    this.sendMessage({
                        type: PayloadType.status,
                        message: `User is ${status}`,
                        status: status,
                        recieverUserName: user.username,
                        sendUser: {
                            username: user.username,
                            connectionId: user.connectionId,
                        }
                    });
                    resolve(true);
                }).catch((err) => {
                    reject(err);
                })
        });
    }

    public updateStatus = (): Promise<any> => {
        return new Promise((resolve, reject) => {
            this.userDBOperation.getUser(this.payload.sendUser.username)
            .then((user: User) => {
                user.username = this.payload.sendUser.username;
                this.getUserSuccessCallback(user, this.payload.status ? this.payload.status : UserStatus.offline)
                .then(() => {
                    resolve(true);
                })
                .catch((err) => {
                    this.logger.error(err);
                    this.errorMessagePayload(err);
                    reject(err);
                })
            })
            .catch(err => {
                this.logger.error(err);
                this.errorMessagePayload(err);
                reject(err);
            });
        })
    }

}