const TurnServer = require("node-turn");
const { v4 } = require("uuid");
const UserDB = require("../../db/userDB");
const Util = require("../../util");

module.exports = class AppTurnServer {

    constructor(userDB) {
        this.id = v4();
        this.logger = new Util().log({ application: 'turn-server' }, { uid: this.id })
        this.userDB = new UserDB(this.logger);
    }

    loadUserInServer = (server) => {
        try {
            const users = this.userDB.getAllUser();
            Object.keys(users).forEach(username => {
                this.logger.info(`Add user ${username} to turn server`)
                server.addUser(username, new Util().decodeBase64(users[username].p));
            });
        }
        catch (err) {
            this.logger.error(`Fail to add user to turn server`)
        }
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