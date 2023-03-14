import { AppApiServer } from "./service/api/server";
import { AppTurnServer } from "./service/turn/server";
import { AppWSServer } from "./service/ws/server";
import { Util } from "./util";

const logger = new Util().log({application: 'main-server'})

new AppWSServer().createServer();
logger.info('WebSocket server initialized !!!');

const turnServer: AppTurnServer = new AppTurnServer();
turnServer.createServer();
logger.info('Turn server initialized !!!');

new AppApiServer(turnServer).createServer();
logger.info('API server initialized initialized');