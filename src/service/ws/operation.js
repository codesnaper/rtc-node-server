const UserDB = require("../../db/userDB");
const Util = require("../../util");

module.exports = class WSStatus {

    constructor(connection, data, logger) {
        this.connection = connection;
        this.data = data;
        this.logger = logger;
        this.userDBOperation = new UserDB(logger);
    }


    sendMessage = (type, message) => {
        this.logger.child(message).debug(`Sending message to Reciever`)
        this.connection.send(JSON.stringify({
            type: type,
            message: message
        }))
    }

    errorCloseConnection = (message, err) => {
        this.logger.child({ 'err': JSON.stringify(err), errMessage: message }).error('Error while Perfoming operation. Sending closing connection request to reciever')
        this.sendMessage('error', message);
        this.connection.close();
        console.error(err ? err : message);
    }

    updateUserStatus = (status) => {
        try {
            this.userDBOperation.updateUserStatus(status, this.data.username);
            this.logger.debug('Status updated in DB.')
        } catch (err) {
            this.errorCloseConnection('Failed to update status', err)
        }
    }

    getUserSuccessCallback = async (user, status) => {
        if (this.data && new Util().decodeBase64(user.p) === this.data.password) {
            this.sendMessage('success', 'Login Success!!!');
            this.updateUserStatus(status);
        } else {
            this.errorCloseConnection('Invalid Password')
        }
    }

    getUserFaliureCallback = (err) => {
        this.errorCloseConnection('Invalid Username / User not found !!!');
    }

    userOnline = (id) => {
        if (this.data && this.data.username != null) {
            this.userDBOperation.getUser(this.data.username)
                .then(user => {
                    this.getUserSuccessCallback(user, 'online');
                })
                .catch(err => {
                    this.errorCloseConnection(err)
                })
        } else {
            this.errorCloseConnection('Username is required');
        }
    }

    userOffline = (id) => {
        if (this.data && this.data.username != null) {
            this.userDBOperation.getUser(this.data.username)
                .then(user => {
                    this.getUserSuccessCallback(user, 'offline');
                })
                .catch(err => {
                    this.errorCloseConnection(err)
                })
        } else {
            this.errorCloseConnection('Username is required');
        }
    }

}