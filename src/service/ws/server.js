const { WebSocketServer } = require("ws");
const WSStatus = require("./operation");

module.exports = class AppWSServer {

    userDb;

    constructor(userDb) {
        this.userDb = userDb;
    }

    sendMessageToUser = (connection, message) => {
        connection.send(JSON.stringify(message));
    }

    createServer() {
        const wss = new WebSocketServer({
            port: 9090,
        })

        wss.on('connection', function (conn) {
            console.log("User connected");

            conn.on('message', (message) => {
                let data = {};
                try {
                    data = JSON.parse(message);
                    console.log(`WS recieve message ${JSON.stringify(data)}`)
                } catch (e) {
                    console.log("Invalid JSON");
                    data = {};
                }
                switch (data.type) {
                    case 'online':
                        new WSStatus(this.userDB, conn, data).userOnline();
                        break;

                    case 'offline':
                        new WSStatus(this.userDB, conn, data).userOffline();
                        break;

                    default:
                        conn.send(JSON.stringify({
                            type: 'error',
                            message: 'Invalid Operation'
                        }));
                        break;
                }
            });

            conn.on('close', function () {
                console.log('Connection Closed to websocket !!!')
            });
        });
    }

}