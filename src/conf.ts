const conf = {
    'log-app-file': 'log/server.log',
    'log-exception-file': 'log/exceptions.log',
    'log-rejection-file': 'log/rejections.log',
    'user-db': 'user',
    'notification-db': 'user-notification',
    'ws-app-name': 'ws-server',
    'ws-port': 9090,
    'turn-app-name': 'turn-server',
    'api-app-name': 'api-server',
    'api-port': 8081,
    'private-key-file':'private-key.pem',
    'public-key-file': 'public-key.pem',
    'db-url': `mongodb+srv://shubhamk:PJqC4NfEo1ztyu4j@app.obmwvps.mongodb.net/?retryWrites=true&w=majority`
}

export default conf;