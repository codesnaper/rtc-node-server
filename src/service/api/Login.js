const { response, request } = require("express");
const Util = require("../../util");

module.exports = class LoginAPI {

    constructor(userDB) {
        this.userDB = userDB;
    }

    createRequest = async (request, response) => {
        if (request.body.username && request.body.password) {
            try {
                const userData = await this.userDB.getData(`/${request.body.username}`);
                if (request.body.password === new Util().decodeBase64(userData.p)) {
                    response.statusCode = 200;
                    response.send({ "message": "login success !!!" });
                } else {
                    response.statusCode = 401;
                    response.send({
                        "message": 'Invalid Password.',
                    })
                }
            } catch (err) {
                response.statusCode = 400;
                response.send({
                    "message": 'User name not found ',
                })
            }
        } else {
            response.statusCode = 400;
            response.statusMessage = "Bad Request"
        }
    }

}