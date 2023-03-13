"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PayloadType = void 0;
var PayloadType;
(function (PayloadType) {
    PayloadType[PayloadType["online"] = 0] = "online";
    PayloadType[PayloadType["offline"] = 1] = "offline";
    PayloadType[PayloadType["answer"] = 2] = "answer";
    PayloadType[PayloadType["denied"] = 3] = "denied";
    PayloadType[PayloadType["offer"] = 4] = "offer";
    PayloadType[PayloadType["error"] = 5] = "error";
    PayloadType[PayloadType["success"] = 6] = "success";
    PayloadType[PayloadType["ring"] = 7] = "ring";
})(PayloadType = exports.PayloadType || (exports.PayloadType = {}));
