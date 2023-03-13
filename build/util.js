"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.Util = void 0;
var uuid_1 = require("uuid");
var winston_1 = require("winston");
var conf_1 = __importDefault(require("./conf"));
var logLevels = {
    fatal: 0,
    error: 1,
    warn: 2,
    info: 3,
    debug: 4,
    trace: 5,
};
var id = (0, uuid_1.v4)();
var Util = /** @class */ (function () {
    function Util() {
        this.encodeBase64 = function (value) {
            var buffer = new Buffer(value);
            return buffer.toString('base64');
        };
        this.decodeBase64 = function (value) {
            var buffer = new Buffer(value, 'base64');
            return buffer.toString('ascii');
        };
        this.log = function (metaData, ctx) {
            if (ctx === void 0) { ctx = undefined; }
            if (ctx == undefined) {
                ctx = {};
            }
            ctx['trace-id'] = id;
            var logger = (0, winston_1.createLogger)({
                levels: logLevels,
                format: winston_1.format.combine(winston_1.format.timestamp(), winston_1.format.json()),
                defaultMeta: metaData,
                transports: [new winston_1.transports.Console({}), new winston_1.transports.File({ filename: conf_1.default["log-app-file"] })],
                exceptionHandlers: [new winston_1.transports.File({ filename: conf_1.default["log-exception-file"] })],
                rejectionHandlers: [new winston_1.transports.File({ filename: conf_1.default["log-rejection-file"] })],
            });
            return logger.child({ context: ctx });
        };
    }
    return Util;
}());
exports.Util = Util;
