import { Request, Response } from "express";
import { Logger } from "winston";
import { UserDB } from "../../db/userDB";
import { User } from "../../model/user";
import { LoginUser } from "../../model/Login";
import { Util } from "../../util";
import { AppTurnServer } from "../turn/server";
import { APIError } from "../../model/ApiError";

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
        const loginUser: User = request.body as User;
        loginUser.password = this.util.encodeBase64(`${loginUser.password}`);
        this.logger.debug(`Adding user ${loginUser.username} into system.`)
        this.userDB.getUser(`${loginUser.username}`)
            .then(() => {
                this.logger.error(`User Name already found in system. Unable to add user ${loginUser.username}`)
                response.statusCode = 400;
                response.statusMessage = "Bad Request"
                const errorData: APIError = {
                    message: 'User Name is already registered',
                    operation: 'Add User',
                    code: 400,
                }
                response.send(errorData);
            }).catch(() => {
                this.userDB.addUser(loginUser)
                    .then(() => {
                        try {
                            this.turnServer.addUser(loginUser);
                            response.statusCode = 201;
                            response.send({message: 'User Added'})
                        } catch (err) {
                            response.statusCode = 500;
                            const errorData: APIError = {
                                message: 'Fail in adding user. Please try again',
                                operation: 'Add User',
                                code: 500,
                                systemError: err
                            }
                            response.send(errorData);
                        }
                    })
                    .catch((err) => {
                        response.statusCode = 500;
                            const errorData: APIError = {
                                message: 'Fail in adding user. Please try again',
                                operation: 'Add User',
                                code: 500,
                                systemError: err
                            }
                            response.send(errorData);
                    })
            });
    }

}