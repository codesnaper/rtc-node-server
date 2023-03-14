import { Request, Response } from "express";
import { Logger } from "winston";
import { UserDB } from "../../db/userDB";
import { User } from "../../model/user";
import { LoginUser } from "../../model/Login";
import { Util } from "../../util";
import { AppTurnServer } from "../turn/server";

export class AddUserApi {

    private userDB: UserDB;

    private turnServer: AppTurnServer;

    private logger: Logger;

    private util: Util = new Util();

    constructor(turnServer: AppTurnServer, logger: Logger) {
        this.turnServer = turnServer;
        this.logger = logger;
        this.userDB = new UserDB(this.logger);
    }

    public processRequest = (request: Request, response: Response): void => {
        const loginUser: LoginUser = request.body as LoginUser;
        this.userDB.getUser(`/${loginUser.username}`)
            .then((user: User) => {
                response.statusCode = 400;
                response.statusMessage = "Bad Request"
                response.send({
                    "message": 'User name is already registered ',
                })
            }).catch(() => {
                this.userDB.addUser({
                    username: loginUser.username,
                    password: this.util.encodeBase64(loginUser.password)
                })
                    .then(() => {
                        try {
                            this.turnServer.addUser(loginUser);
                        } catch (err) {
                            response.statusCode = 500;
                            response.send({
                                "message": 'Failed in adding user to server ',
                                'error': err
                            });
                            response.statusCode = 201;
                            response.send('User Added')
                        }
                    })
                    .catch((err) => {
                        response.statusCode = 500;
                        response.send({
                            "message": 'Failed in adding user to DB ',
                            'error': err
                        })
                    })
            });
    }

}