const { WebSocketServer } = require("ws");
const WSStatus = require("./operation");
const { v4 } = require('uuid');
const Util = require("../../util");
const WSCallUser = require("./callUser");

module.exports = class AppWSServer {

    id = 0;

    connections = new Map();

    sendMessageToUser = (connection, message) => {
        connection.send(JSON.stringify(message));
    }

    createServer = () => {
        const wss = new WebSocketServer({
            port: 9090,
        });

        wss.on('connection', (conn) => {
            const id = v4();
            this.connections.set(id, conn);
            const logger = new Util().log({ application: 'ws-server' }, { uid: id })
            logger.info('Web Socket Connection Successfull !!!')
            conn.on('message', (message) => {
                let data = {};
                try {
                    data = JSON.parse(message);
                } catch (e) {
                    logger.error('Invalid Message payload recieved ' + e)
                    data = {};
                }
                switch (data.type) {
                    case 'online':
                        logger.child({ operation: data.type, username: data.username }).info('Call change status to Online')
                        new WSStatus(conn, data, logger).userOnline(id);
                        break;

                    case 'offline':
                        logger.child({ operation: data.type, username: data.username }).info('Call change status to Offline')
                        new WSStatus(conn, data, logger).userOffline(id);
                        break;

                    case 'offer':
                        logger.child({ operation: data.type, 'Callee': data.username, 'Caller': data.currentUser.username }).info('Caller making call to Callee,')
                        new WSCallUser(conn, this.connections, data, logger).call();
                        break;

                    case 'answer':
                        logger.child({ operation: data.type, 'Caller': data.username, 'Callee': data.currentUser.username }).info('Callee answering call of caller')
                        //send answer object
                        break;

                    case 'denied':
                        logger.child({ operation: data.type, 'Caller': data.username, 'Callee': data.currentUser.username }).info('Callee denied call of caller')

                        break;

                    default:
                        logger.child({ operation: data.type, username: data.username }).error(`Invalid operation = ${data.type} recieved in message payload`)
                        conn.send(JSON.stringify({
                            type: 'error',
                            message: 'Invalid Operation'
                        }));
                        break;
                }
            });

            conn.on('close', () => {
                this.connections.delete(id);
                logger.info('Connection Closed to websocket !!!')
            });
        });
    }

}