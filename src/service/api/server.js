const AddUserApi = require("./AddUser");
const LoginAPI = require("./Login");
const { response, request } = require("express");
var express = require('express');
module.exports = class AppApiServer {

    userDb;

    turnServer;

    constructor(userDb, turnServer) {
        this.userDb = userDb;
        this.turnServer = turnServer;
    }

    endpoints = (app) => {
        app.post('/addUser', async (request, response) => {
            new AddUserApi(this.userDb, this.turnServer).createRequest(request, response);
        });

        app.post('/login', async (request, response) => {
            new LoginAPI(this.userDb).createRequest(request, response);
        });
    }

    createServer() {
        var app = express();
        app.use(express.json());
        this.endpoints(app);
        const restServer = app.listen(8081, function () {
            const host = restServer.address().address
            const port = restServer.address().port
            console.log("Example app listening at http://%s:%s", host, port)
        })
    }
}