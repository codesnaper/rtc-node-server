"use strict";
var TurnServer = require("node-turn");
var v4 = require("uuid").v4;
var UserDB = require("../../db/userDB");
var Util = require("../../util");
module.exports = /** @class */ (function () {
    function AppTurnServer() {
        var _this = this;
        this.loadUserInServer = function (server) {
            _this.userDB.getAllUser()
                .then(function (users) {
                Object.keys(users).forEach(function (username) {
                    _this.logger.info("Add user ".concat(username, " to turn server"));
                    server.addUser(username, new Util().decodeBase64(users[username].p));
                });
            }).catch(function (err) {
                _this.logger.child({ 'errMessage': err }).error("Fail to add user to turn server");
            });
        };
        this.createServer = function () {
            var server = new TurnServer({
                authMech: 'long-term',
                debugLevel: "ALL"
            });
            _this.loadUserInServer(server);
            server.start();
        };
        this.id = v4();
        this.logger = new Util().log({ application: 'turn-server' }, { uid: this.id });
        this.userDB = new UserDB(this.logger);
    }
    return AppTurnServer;
}());
