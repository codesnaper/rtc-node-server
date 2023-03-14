import { Logger } from "winston";
import { UserDB } from "../../db/userDB";
import { Payload } from "../../model/payload";
import { User } from "../../model/user";
import { Util } from "../../util";

export class PasswordChecker{

    private logger: Logger;

    private userDB: UserDB;

    private util: Util;

    constructor( logger:Logger){
        this.logger = logger;
        this.userDB = new UserDB(this.logger);
        this.util = new Util();
    }

    public validatePassword = (loginUser: User): Promise<boolean> => {
        return new Promise((resolve, reject) => {
            try{
                this.userDB.getUser(loginUser.username)
                .then((user: User) => {
                    const password: string  = this.util.decodeBase64(user.password? user.password: '');
                    password === loginUser.password ? resolve(true): reject('Password is Invalid');
                }).catch(err => {
                    reject(err);
                })
            } catch(err){
                reject(err);
            }
        });
    }


}