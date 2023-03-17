import { Request, Response } from "express";
import { Logger } from "winston";
import { UserDB } from "../../db/userDB";
import { APIError } from "../../model/ApiError";
import { LoginUser } from "../../model/Login";
import { User } from "../../model/user";
import { Util } from "../../util";
import { Token } from "./token.";

export class LoginAPI {

    private logger: Logger;
    private userDB: UserDB;

    private util: Util = new Util();

    private token: Token;

    constructor(logger: Logger) {
        this.logger = logger;
        this.userDB = new UserDB(this.logger);
        this.token = new Token(this.logger);
    }

    public processRequest = (request: Request, response: Response): void => {
        const loginUser: LoginUser = request.body as LoginUser;
        this.userDB.getUser(`${request.body.username}`)
            .then((user: User) => {
                if (loginUser.password === this.util.decodeBase64(`${user.password}`)) {
                    this.token.generateToken(user)
                        .then(token => {
                            this.logger.info(`User ${user.username} login successfully to system with new token`)
                            response.statusCode = 200;
                            response.send({ "token": token, "user": user });
                        })
                        .catch((err) => {
                            this.logger.child({'error': err}).error(`${user.username} failed to login into system.`)
                            const errorData: APIError = {
                                message: 'Error in login. Please try again',
                                operation: 'Login User',
                                code: 500,
                                systemError: err,
                            }
                            response.statusCode = 500;
                            response.send(errorData);
                        });
                } else {
                    this.logger.error(`${user.username} failed to login into system due to incorrect password`)
                    response.statusCode = 401;
                    const errorData: APIError = {
                        message: 'Password in invalid',
                        operation: 'Login User',
                        code: 401,
                    }
                    response.send(errorData);
                }
            }).catch((err) => {
                this.logger.error(`${loginUser.username} not found in system`)
                response.statusCode = 401;
                const errorData: APIError = {
                    message: 'Username not found. Please create new Profile',
                    operation: 'Login User',
                    code: 401,
                    systemError: err,
                }
                response.send(errorData);
            })
    }

}