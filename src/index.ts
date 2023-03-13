import { AppWSServer } from "./service/ws/server";
import { Util } from "./util";

const logger = new Util().log({application: 'main-server'})

new AppWSServer().createServer();
logger.info('WebSocket server initialized initialized')