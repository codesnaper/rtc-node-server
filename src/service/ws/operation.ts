import { Logger } from "winston";
import { WebSocket } from "ws";
import { UserDB } from "../../db/userDB";
import { Payload, PayloadType } from "../../model/payload";
import { UserStatus } from "../../model/statusEnum";
import { User } from "../../model/user";
import { Util } from "../../util";

export class WSStatus {

    private websocketConnection: WebSocket;

    private payload: Payload;

    private logger: Logger;

    private userDBOperation: UserDB;

    private util: Util;

    constructor(connection: WebSocket, payload: Payload, logger: Logger) {
        this.websocketConnection = connection;
        this.payload = payload;
        this.logger = logger;
        this.userDBOperation = new UserDB(logger);
        this.util = new Util();
    }


    private sendMessage = (payload: Payload): void => {
        this.logger.child({ payloadType: payload.type, recieverUser: payload.recieverUserName, senderUser: payload.sendUser.username }).debug(`Sending message to Reciever`)
        this.websocketConnection.send(JSON.stringify(payload))
    }

    private errorCloseConnection = (message: string, err: any | undefined = undefined): void => {
        this.logger.child({ 'err': JSON.stringify(err), errMessage: message }).error('Error while Perfoming operation. Sending closing connection request to reciever')
        this.sendMessage({
            type: PayloadType.error,
            message: message,
            recieverUserName: 'client',
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
            this.errorCloseConnection('Failed to update status', err)
        }
    }

    private getUserSuccessCallback = async (user: User, status: UserStatus): Promise<void> => {
        this.updateUserStatus(status);
        user.status = status
        this.sendMessage({
            type: PayloadType.success,
            message: `User is ${UserStatus[status]}` ,
            recieverUserName: user.username,
            sendUser: {
                username: user.username,
                connectionId: user.connectionId,
                status: user.status
            }
        });
    }

    private updateUserConnectionId = async (user: User, connectionId: string): Promise<void> => {
        this.userDBOperation.updateConnectionId(connectionId, user.username)
            .catch(err => {
                this.logger.child({ user: user.username, connectionid: connectionId, errMessage: err }).error('Failed in updating connection id to user')
            });
    }

    private deleteConnectionId = async (user: User): Promise<void> => {
        this.userDBOperation.deleteConnectionId(user.username)
            .catch(err => {
                this.logger.child({ user: user.username, connectionid: user.connectionId, errMessage: err }).error('Failed in updating connection id to user')
            });
    }

    public userOnline = (connectionId: string): void => {
        this.userDBOperation.getUser(this.payload.sendUser.username)
            .then((user: User) => {
                if(user.connectionId == undefined){
                    this.updateUserConnectionId(user, connectionId);
                }
                user.connectionId = user.connectionId ? user.connectionId: connectionId;
                user.username = this.payload.sendUser.username;
                this.getUserSuccessCallback(user, UserStatus.online);
            })
            .catch(err => {
                this.errorCloseConnection(err)
            });
    }

    public userOffline = (): void => {
        this.userDBOperation.getUser(this.payload.sendUser.username)
            .then(user => {
                this.deleteConnectionId(user);
                this.getUserSuccessCallback(user, UserStatus.offline);
            })
            .catch(err => {
                this.errorCloseConnection(err)
            });
    }

}