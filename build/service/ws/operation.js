"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g;
    return g = { next: verb(0), "throw": verb(1), "return": verb(2) }, typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (g && (g = 0, op[0] && (_ = 0)), _) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.WSStatus = void 0;
var userDB_1 = require("../../db/userDB");
var payload_1 = require("../../model/payload");
var statusEnum_1 = require("../../model/statusEnum");
var util_1 = require("../../util");
var WSStatus = /** @class */ (function () {
    function WSStatus(connection, payload, logger) {
        var _this = this;
        this.sendMessage = function (payload) {
            _this.logger.child({ payloadType: payload.type, recieverUser: payload.recieverUserName, senderUser: payload.sendUser.username }).debug("Sending message to Reciever");
            _this.websocketConnection.send(JSON.stringify(payload));
        };
        this.errorCloseConnection = function (message, err) {
            if (err === void 0) { err = undefined; }
            _this.logger.child({ 'err': JSON.stringify(err), errMessage: message }).error('Error while Perfoming operation. Sending closing connection request to reciever');
            _this.sendMessage({
                type: payload_1.PayloadType.error,
                message: message,
                recieverUserName: 'client',
                sendUser: {
                    username: 'server'
                }
            });
        };
        this.updateUserStatus = function (status) {
            try {
                _this.userDBOperation.updateUserStatus(status, _this.payload.sendUser.username);
                _this.logger.debug('Status updated in DB.');
            }
            catch (err) {
                _this.errorCloseConnection('Failed to update status', err);
            }
        };
        this.getUserSuccessCallback = function (user, status) { return __awaiter(_this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                this.updateUserStatus(status);
                user.status = status;
                this.sendMessage({
                    type: payload_1.PayloadType.success,
                    message: "User is ".concat(status),
                    recieverUserName: user.username,
                    sendUser: user
                });
                return [2 /*return*/];
            });
        }); };
        this.updateUserConnectionId = function (user, connectionId) { return __awaiter(_this, void 0, void 0, function () {
            var _this = this;
            return __generator(this, function (_a) {
                this.userDBOperation.updateConnectionId(connectionId, user.username)
                    .catch(function (err) {
                    _this.logger.child({ user: user.username, connectionid: connectionId, errMessage: err }).error('Failed in updating connection id to user');
                });
                return [2 /*return*/];
            });
        }); };
        this.deleteConnectionId = function (user) { return __awaiter(_this, void 0, void 0, function () {
            var _this = this;
            return __generator(this, function (_a) {
                this.userDBOperation.deleteConnectionId(user.username)
                    .catch(function (err) {
                    _this.logger.child({ user: user.username, connectionid: user.connectionId, errMessage: err }).error('Failed in updating connection id to user');
                });
                return [2 /*return*/];
            });
        }); };
        this.userOnline = function (connectionId) {
            _this.userDBOperation.getUser(_this.payload.sendUser.username)
                .then(function (user) {
                _this.getUserSuccessCallback(user, statusEnum_1.UserStatus.online);
                _this.updateUserConnectionId(user, connectionId);
            })
                .catch(function (err) {
                _this.errorCloseConnection(err);
            });
        };
        this.userOffline = function () {
            _this.userDBOperation.getUser(_this.payload.sendUser.username)
                .then(function (user) {
                _this.getUserSuccessCallback(user, statusEnum_1.UserStatus.offline);
                _this.deleteConnectionId(user);
            })
                .catch(function (err) {
                _this.errorCloseConnection(err);
            });
        };
        this.websocketConnection = connection;
        this.payload = payload;
        this.logger = logger;
        this.userDBOperation = new userDB_1.UserDB(logger);
        this.util = new util_1.Util();
    }
    return WSStatus;
}());
exports.WSStatus = WSStatus;
