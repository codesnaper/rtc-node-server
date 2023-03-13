const AddUserApi = require("./AddUser");
const LoginAPI = require("./Login");
const { response, request } = require("express");
var express = require('express');
const { v4 } = require("uuid");
const Util = require("../../util");
module.exports = class AppApiServer {

    constructor(userDb, turnServer) {
        this.userDb = userDb;
        this.turnServer = turnServer;
        this.id = v4();
        this.logger = new Util().log({ application: 'api-server' }, { uid: this.id });
    }

    endpoints = (app) => {
        app.post('/addUser', async (request, response) => {
            new AddUserApi(this.userDb, this.turnServer, this.logger).createRequest(request, response);
        });

        app.post('/login', async (request, response) => {
            new LoginAPI(this.userDb).createRequest(request, response);
        });
    }

    createServer() {
        var app = express();
        app.use(express.json());
        this.endpoints(app);
        const restServer = app.listen(8081, () => {
            const host = restServer.address().address
            const port = restServer.address().port
            this.logger.info(`Example app listening at http://${host}:${port}`)
        })
    }
}