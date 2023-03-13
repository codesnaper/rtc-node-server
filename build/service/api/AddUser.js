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
var _a = require("express"), response = _a.response, request = _a.request;
var Util = require("../../util");
module.exports = /** @class */ (function () {
    function AddUserApi(userDB, turnServer, logger) {
        var _this = this;
        this.createRequest = function (request, response) { return __awaiter(_this, void 0, void 0, function () {
            var user_1, userData, err_1;
            var _this = this;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        if (!(request.body.username && request.body.password)) return [3 /*break*/, 5];
                        user_1 = {
                            username: request.body.username,
                            password: new Util().encodeBase64(request.body.password)
                        };
                        _a.label = 1;
                    case 1:
                        _a.trys.push([1, 3, , 4]);
                        return [4 /*yield*/, this.userDB.getData("/".concat(user_1.username))];
                    case 2:
                        userData = _a.sent();
                        response.statusCode = 400;
                        response.statusMessage = "Bad Request";
                        response.send({
                            "message": 'User name is already registered ',
                        });
                        return [3 /*break*/, 4];
                    case 3:
                        err_1 = _a.sent();
                        this.userDB.push("/".concat(user_1.username), { 'p': user_1.password }, false)
                            .then(function () {
                            try {
                                _this.turnServer.addUser(user_1.username, request.body.password);
                            }
                            catch (err) {
                                response.statusCode = 500;
                                response.send({
                                    "message": 'Failed in adding user to server ',
                                    'error': err
                                });
                            }
                            response.statusCode = 201;
                            response.send('User Added');
                        })
                            .catch(function (err) {
                            response.statusCode = 500;
                            response.send({
                                "message": 'Failed in adding user to DB ',
                                'error': err
                            });
                        });
                        return [3 /*break*/, 4];
                    case 4: return [3 /*break*/, 6];
                    case 5:
                        response.statusCode = 400;
                        response.statusMessage = "Bad Request";
                        response.send({
                            "message": 'Missing username or password in body ',
                            'error': err
                        });
                        _a.label = 6;
                    case 6: return [2 /*return*/];
                }
            });
        }); };
        this.userDB = userDB;
        this.turnServer = turnServer;
        this.logger = logger;
    }
    return AddUserApi;
}());
