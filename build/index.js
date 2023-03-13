"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var server_1 = require("./service/ws/server");
var util_1 = require("./util");
var logger = new util_1.Util().log({ application: 'main-server' });
new server_1.AppWSServer().createServer();
logger.info('WebSocket server initialized initialized');
