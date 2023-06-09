import { Logger } from "winston";
import { WebSocket } from "ws";
import { UserDB } from "../../db/userDB";
import { Payload, PayloadType } from "../../model/payload";
import { User } from "../../model/user";

export class WSCalleeAnswer {

    private websocketConnection: WebSocket;

    private payload: Payload;

    private logger: Logger;

    private userDB: UserDB;

    private connections: Map<string, WebSocket>;

    constructor(websocketConnection: WebSocket, payload: Payload, logger: Logger, connections: Map<string, WebSocket>) {
        this.websocketConnection = websocketConnection;
        this.payload = payload;
        this.logger = logger;
        this.userDB = new UserDB(logger);
        this.connections = connections;
    }

    private sendMessage = (payloadType: PayloadType, answer : any, websocketConnection: WebSocket, user: User, recieverUsername: string): void => {
        this.logger.child({'caller': user.username, callee: recieverUsername}).debug(`Sending message to Reciever`)
        websocketConnection.send(JSON.stringify({
            type: payloadType,
            answer: answer,
            recieverUserName: recieverUsername,
            sendUser: {
                username: user.username
            }
        }));
    }

    private errorMessagePayload = (message: string, err: any| undefined = undefined): void => {
        this.logger.child({ 'error': JSON.stringify(err), errorMessage: message }).error('Error while Perfoming operation. Sending closing connection request to reciever')
        this.websocketConnection.send(JSON.stringify({
            type: PayloadType.error,
            message: message,
            recieverUserName: this.payload.sendUser.username,
            sendUser: {
                username: 'server'
            }
        }));
        console.error(err ? err : message);
    }

    public answer = (): void => {
        this.userDB.getUser(this.payload.recieverUserName)
            .then(user => {
                if (user.connectionId != null) {
                    const connection: WebSocket | undefined = this.connections.get(user.connectionId);
                    if(connection){
                        this.sendMessage(PayloadType.answer, this.payload.answer, connection, this.payload.sendUser, user.username);
                    } else{
                        this.errorMessagePayload(`${this.payload.recieverUserName} is not connected!!!`);
                    }
                } else {
                    //send notification to user
                    this.errorMessagePayload(`${this.payload.recieverUserName} is not connected!!!`);
                }
            }).catch(err => {
                this.logger.error(err);
                this.errorMessagePayload(`Error in calling ${this.payload.recieverUserName}  `,err);
            })
    }
}