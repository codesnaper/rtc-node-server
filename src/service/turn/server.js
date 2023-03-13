const TurnServer = require("node-turn");
const { v4 } = require("uuid");
const UserDB = require("../../db/userDB");
const Util = require("../../util");

module.exports = class AppTurnServer {

    constructor() {
        this.id = v4();
        this.logger = new Util().log({ application: 'turn-server' }, { uid: this.id })
        this.userDB = new UserDB(this.logger);
    }

    loadUserInServer = (server) => {
        this.userDB.getAllUser()
            .then(users => {
                Object.keys(users).forEach(username => {
                    this.logger.info(`Add user ${username} to turn server`)
                    server.addUser(username, new Util().decodeBase64(users[username].p));
                });
            }).catch(err => {
                this.logger.child({'errMessage': err}).error(`Fail to add user to turn server`)
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