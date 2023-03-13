"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.WSCallUser = void 0;
var notificationDB_1 = require("../../db/notificationDB");
var userDB_1 = require("../../db/userDB");
var payload_1 = require("../../model/payload");
var statusEnum_1 = require("../../model/statusEnum");
var WSCallUser = /** @class */ (function () {
    function WSCallUser(websocketConnection, payload, logger, connections) {
        var _this = this;
        this.sendMessage = function (payloadType, offer, websocketConnection, user, recieverUsername) {
            _this.logger.child({ 'caller': user.username, callee: recieverUsername }).debug("Sending message to Reciever");
            websocketConnection.send(JSON.stringify({
                type: payloadType,
                offer: offer,
                recieverUserName: recieverUsername,
                sendUser: {
                    username: user.username
                }
            }));
        };
        this.errorMessagePayload = function (message, err) {
            if (err === void 0) { err = undefined; }
            _this.logger.child({ 'err': JSON.stringify(err), errMessage: message }).error('Error while Perfoming operation. Sending closing connection request to reciever');
            _this.websocketConnection.send(JSON.stringify({
                type: payload_1.PayloadType.error,
                message: message,
                recieverUserName: 'client',
                sendUser: {
                    username: 'server'
                }
            }));
            console.error(err ? err : message);
        };
        this.call = function () {
            _this.userDB.getUser(_this.payload.recieverUserName)
                .then(function (user) {
                if (user.status == statusEnum_1.UserStatus.online && user.connectionId != null) {
                    var connection = _this.connections.get(user.connectionId);
                    if (connection) {
                        _this.sendMessage(payload_1.PayloadType.ring, _this.payload.offer, connection, _this.payload.sendUser, user.username);
                    }
                    else {
                        _this.errorMessagePayload('Reciever not online');
                    }
                }
                else {
                    //send notification to user
                    _this.errorMessagePayload("".concat(_this.payload.recieverUserName, " is offline!!!"));
                }
            }).catch(function (err) {
                _this.errorMessagePayload("Error in calling ".concat(_this.payload.recieverUserName, "  "), err);
            });
        };
        this.websocketConnection = websocketConnection;
        this.payload = payload;
        this.logger = logger;
        this.userDB = new userDB_1.UserDB(logger);
        this.notificationDB = new notificationDB_1.NotificationDB(logger);
        this.connections = connections;
    }
    return WSCallUser;
}());
exports.WSCallUser = WSCallUser;
