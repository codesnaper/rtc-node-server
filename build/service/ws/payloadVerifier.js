"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PayloadVerifier = void 0;
var userDB_1 = require("../../db/userDB");
var util_1 = require("../../util");
var PayloadVerifier = /** @class */ (function () {
    function PayloadVerifier(payload, logger) {
        var _this = this;
        this.payloadChecker = function () {
            return new Promise(function (resolve, reject) {
                try {
                    _this.userDB.getUser(_this.payload.sendUser.username)
                        .then(function (user) {
                        var password = _this.util.decodeBase64(user.password ? user.password : '');
                        password === _this.payload.sendUser.password ? resolve(true) : reject('Password is Invalid');
                    }).catch(function (err) {
                        reject(err);
                    });
                }
                catch (err) {
                    reject(err);
                }
            });
        };
        this.payload = payload;
        this.logger = logger;
        this.userDB = new userDB_1.UserDB(this.logger);
        this.util = new util_1.Util();
    }
    return PayloadVerifier;
}());
exports.PayloadVerifier = PayloadVerifier;
