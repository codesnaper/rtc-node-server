const { response, request } = require("express");
const Util = require("../../util");

module.exports = class AddUserApi {

    constructor(userDB, turnServer, logger) {
        this.userDB = userDB;
        this.turnServer = turnServer;
        this.logger = logger;
    }

    createRequest = async (request, response) => {
        if (request.body.username && request.body.password) {
            const user = {
                username: request.body.username,
                password: new Util().encodeBase64(request.body.password)
            }
            try {
                const userData = await this.userDB.getData(`/${user.username}`);
                response.statusCode = 400;
                response.statusMessage = "Bad Request"
                response.send({
                    "message": 'User name is already registered ',
                })
            } catch (err) {
                this.userDB.push(`/${user.username}`, { 'p': user.password }, false)
                    .then(() => {
                        try {
                            this.turnServer.addUser(user.username, request.body.password);
                        } catch (err) {
                            response.statusCode = 500;
                            response.send({
                                "message": 'Failed in adding user to server ',
                                'error': err
                            });
                        }
                        response.statusCode = 201;
                        response.send('User Added')
                    })
                    .catch(err => {
                        response.statusCode = 500;
                        response.send({
                            "message": 'Failed in adding user to DB ',
                            'error': err
                        })
                    });
            }
        } else {
            response.statusCode = 400;
            response.statusMessage = "Bad Request"
            response.send({
                "message": 'Missing username or password in body ',
                'error': err
            })
        }
    }

}