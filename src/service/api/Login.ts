import { Request, Response } from "express";
import { Logger } from "winston";
import { UserDB } from "../../db/userDB";
import { LoginUser } from "../../model/Login";
import { User } from "../../model/user";
import { Util } from "../../util";

export class LoginAPI {

    private logger: Logger;
    private userDB: UserDB;

    private util: Util = new Util();

    constructor(logger: Logger) {
        this.logger = logger;
        this.userDB = new UserDB(this.logger);
    }

    public processRequest = (request: Request, response: Response): void => {
        const loginUser: LoginUser = request.body as LoginUser;
        try {
            this.userDB.getUser(`/${request.body.username}`)
            .then((user: User) => {
                if (loginUser.password === this.util.decodeBase64(`${user.password}`)) {
                    response.statusCode = 200;
                    response.send({ "message": "login success !!!" });
                } else {
                    response.statusCode = 401;
                    response.send({
                        "message": 'Invalid Password.',
                    })
                }
            })
        } catch (err) {
            response.statusCode = 400;
            response.send({
                "message": 'User name not found ',
            })
        }
    }
}