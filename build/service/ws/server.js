"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AppWSServer = void 0;
var uuid_1 = require("uuid");
var ws_1 = require("ws");
var payload_1 = require("../../model/payload");
var util_1 = require("../../util");
var callUser_1 = require("./callUser");
var operation_1 = require("./operation");
var conf_1 = __importDefault(require("./../../conf"));
var payloadVerifier_1 = require("./payloadVerifier");
var AppWSServer = /** @class */ (function () {
    function AppWSServer() {
        var _this = this;
        this.connections = new Map();
        this.util = new util_1.Util();
        this.id = (0, uuid_1.v4)();
        this.logger = this.util.log({ application: conf_1.default["ws-app-name"] }, { uid: this.id });
        this.sendMessageToUser = function (connection, message) {
            connection.send(message);
        };
        this.errorMessagePayload = function (message, websocketConnection, err) {
            if (err === void 0) { err = undefined; }
            _this.logger.child({ 'err': JSON.stringify(err), errMessage: message }).error('Error while Perfoming operation. Sending closing connection request to reciever');
            websocketConnection.send(JSON.stringify({
                type: payload_1.PayloadType.error,
                message: message,
                recieverUserName: 'client',
                sendUser: {
                    username: 'server'
                }
            }));
            console.error(err ? err : message);
        };
        this.createServer = function () {
            var wss = new ws_1.WebSocketServer({
                port: conf_1.default["ws-port"],
            });
            wss.on('connection', function (websocketConnection) {
                _this.logger.info('Web Socket Connection Successfull !!!');
                websocketConnection.on('message', function (message) {
                    var payload;
                    try {
                        payload = JSON.parse(Buffer.from(message).toString());
                    }
                    catch (e) {
                        _this.logger.error('Invalid Message payload recieved ' + e);
                    }
                    if (payload != undefined) {
                        var payloadVerifier = new payloadVerifier_1.PayloadVerifier(payload, _this.logger);
                        payloadVerifier.payloadChecker()
                            .then(function () {
                            if (payload != undefined) {
                                switch (payload.type) {
                                    case payload_1.PayloadType.online:
                                        var connectionId = (0, uuid_1.v4)();
                                        _this.logger.child({ operation: payload.type, username: payload.sendUser.username, connectionId: connectionId }).info('Call change status to Online');
                                        _this.connections.set(connectionId, websocketConnection);
                                        new operation_1.WSStatus(websocketConnection, payload, _this.logger).userOnline(connectionId);
                                        break;
                                    case payload_1.PayloadType.offline:
                                        _this.logger.child({ operation: payload.type, username: payload.sendUser.username, connectionId: payload.sendUser.connectionId }).info('Call change status to Offline');
                                        new operation_1.WSStatus(websocketConnection, payload, _this.logger).userOffline();
                                        if (payload.sendUser.connectionId) {
                                            _this.connections.delete(payload.sendUser.connectionId);
                                        }
                                        break;
                                    case payload_1.PayloadType.offer:
                                        _this.logger.child({ operation: payload.type, 'Callee': payload.recieverUserName, 'Caller': payload.sendUser.username }).info('Caller making call to Callee,');
                                        new callUser_1.WSCallUser(websocketConnection, payload, _this.logger, _this.connections).call();
                                        break;
                                    // //send answer object
                                    // case PayloadType.answer:
                                    //     logger.child({ operation: data.type, 'Caller': data.username, 'Callee': data.currentUser.username }).info('Callee answering call of caller')
                                    //     new WSCalleeAnswer(conn, this.connections, data, logger).answer();
                                    //     break;
                                    // case PayloadType.denied:
                                    //     logger.child({ operation: data.type, 'Caller': data.username, 'Callee': data.currentUser.username }).info('Callee denied call of caller')
                                    //     new WSCalleeDenied(conn, this.connections, data, logger).deny();
                                    //     break;
                                    default:
                                        _this.logger.child({ operation: payload.type, username: payload.sendUser.username }).error("Invalid operation = ".concat(payload.type, " recieved in message payload"));
                                        websocketConnection.send(JSON.stringify({
                                            type: 'error',
                                            message: 'Invalid Operation'
                                        }));
                                        break;
                                }
                            }
                        })
                            .catch(function (err) {
                            _this.logger.child({ errorMessage: JSON.stringify(err) }).error("Error in Payload verifier");
                            _this.errorMessagePayload(err, websocketConnection);
                            websocketConnection.close();
                        });
                    }
                    else {
                        _this.logger.error("Invalid Payload recieved");
                        _this.errorMessagePayload('Invalid Payload recieved', websocketConnection);
                    }
                });
                websocketConnection.on('close', function () {
                    _this.connections.delete(_this.id);
                    _this.logger.child({ type: 'summary' }).info("Total User connected  ".concat(_this.connections.size));
                    _this.logger.info('Connection Closed to websocket !!!');
                });
            });
        };
    }
    return AppWSServer;
}());
exports.AppWSServer = AppWSServer;
