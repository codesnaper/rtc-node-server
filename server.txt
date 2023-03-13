const { JsonDB, Config } = require('node-json-db');
const AppWSServer = require('./src/service/ws/server');
const AppTurnServer = require('./src/service/turn/server');
const AppApiServer = require('./src/service/api/server');
const Util = require('./src/util');

const logger = new Util().log({application: 'main-server'})

new AppWSServer().createServer();
logger.info('WebSocket server initialized initialized')

const turnServer = new AppTurnServer();
turnServer.createServer();
logger.info('Turn server initialized initialized')

// new AppApiServer(userDB, turnServer).createServer();
logger.info('API server initialized initialized')
