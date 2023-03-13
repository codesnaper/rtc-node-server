const { JsonDB, Config } = require('node-json-db');
const AppWSServer = require('./src/service/ws/server');
const AppTurnServer = require('./src/service/turn/server');
const AppApiServer = require('./src/service/api/server');

const userDB = new JsonDB(new Config("user", true, true, '/'));

new AppWSServer(userDB).createServer();

const turnServer = new AppTurnServer(userDB);
turnServer.createServer();

new AppApiServer(userDB, turnServer).createServer();