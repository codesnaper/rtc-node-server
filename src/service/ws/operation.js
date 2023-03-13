const Util = require("../../util");

module.exports =  class WSStatus{

    userDB;
    connection;
    data;

    constructor(userDB, connection, data){
        this.userDB = userDB;
        this.connection = connection;
        this.data = data;
    }


    sendMessage = (type, message) =>{
        this.connection.send(JSON.stringify({
            type: type,
            message: message
        }))
    }

    errorCloseConnection = (message, err) => {
        this.sendMessage('error', message);
        this.connection.close();
        console.error(err ? err: message);
    }

    updateUserStatus = async (status) =>{
        try{
            await this.userDB.push(`/${this.data.username}`, {status: status} , false);
        } catch(err){
            this.errorCloseConnection('Failed to update status', err)
        }
    }

    getUserSuccessCallback = async(user, status) => {
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

    userOnline = () =>{
        if(this.data && this.data.username != null){
            this.userDB.getData(`/${this.data.username}`)
            .then(async(user) => {
                this.getUserSuccessCallback(user , 'online');
            })
            .catch(err => {this.getUserFaliureCallback(err)})
        } else{
            this.errorCloseConnection('Username is required');
        }
    }

    userOffline = () =>{
        if(this.data && this.data.username != null){
            this.userDB.getData(`/${this.data.username}`)
            .then(async(user) => {
                this.getUserSuccessCallback(user , 'offline');
            })
            .catch(err => {this.getUserFaliureCallback(err)})
        } else{
            this.errorCloseConnection('Username is required');
        }
    }
 
}