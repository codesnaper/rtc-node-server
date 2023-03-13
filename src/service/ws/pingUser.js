const NotificationDB = require("../../db/notificationDB");
const UserDB = require("../../db/userDB");

module.exports =  class WSPingUser{
    connection;
    data;
    logger;

    constructor(connection, connections, data, logger){
        this.connection = connection;
        this.connections = connections;
        this.data = data;
        this.logger = logger;
        this.userDB = new UserDB(logger);
        this.notificationDB = new NotificationDB(logger);
    }

    sendMessage = (type, message, connection) =>{
        this.logger.child(message).debug(`Sending message to Reciever`)
        connection.send(JSON.stringify({
            type: type,
            message: message
        }))
    }

    errorCloseConnection = (message, err) => {
        this.logger.child({'err': JSON.stringify(err) , errMessage: message}).error('Error while Perfoming operation. Sending closing connection request to reciever')
        this.sendMessage('error', message);
        this.connection.close();
        console.error(err ? err: message);
    }

    pingUser = () => {
        try{
            const user = this.userDB.getUser(this.data.username);
            if(user.status && user.status === 'online' && user.connectionId != null) {
                const connection = this.connections.get(user.connectionId);
                this.sendMessage('call',this.data.offer, connection);
            } else{
                this.errorCloseConnection(`${this.data.username} is offline!!!` );
            }
        } catch(err){
            this.errorCloseConnection(err);
        }
    }

}