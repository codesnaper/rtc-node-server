const TurnServer = require("node-turn");
const Util = require("../../util");

module.exports = class AppTurnServer{

    userDB;

    constructor(userDB){
        this.userDB = userDB;
    }

    loadUserInServer = (server) => {
        this.userDB.getData("/").then(user => {
            Object.keys(user).forEach(username => {
                console.log(`add user ${username} to server`)
                server.addUser(username, new Util().decodeBase64(user[username].p));
            })
        });
    }
    
    createServer = () => {
        var server = new TurnServer({
            authMech: 'long-term',
            debugLevel: "ALL"
        });
        this.loadUserInServer(server);
        server.start();
    }
}