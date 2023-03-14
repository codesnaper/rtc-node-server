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
            message: payload.message ,
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

    private updateUserStatus = (status: UserStatus): void => {
        try {
            this.userDBOperation.updateUserStatus(status, this.payload.sendUser.username);
            this.logger.debug('Status updated in DB.')
        } catch (err) {
            this.errorMessagePayload('Failed to update status', err)
        }
    }

    private getUserSuccessCallback = async (user: User, status: UserStatus): Promise<void> => {
        this.updateUserStatus(status);
        user.status = status
        this.sendMessage({
            type: PayloadType.success,
            message: `User is ${status}` ,
            recieverUserName: user.username,
            sendUser: {
                username: user.username,
                connectionId: user.connectionId,
                status: user.status
            }
        });
    }

    public updateStatus = (): void => {
        this.userDBOperation.getUser(this.payload.sendUser.username)
            .then((user: User) => {
                user.username = this.payload.sendUser.username;
                this.getUserSuccessCallback(user, this.payload.status? this.payload.status: UserStatus.offline);
            })
            .catch(err => {
                this.errorMessagePayload(err)
            });
    }

}