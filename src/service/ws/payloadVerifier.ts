import { Logger } from "winston";
import { UserDB } from "../../db/userDB";
import { Payload } from "../../model/payload";
import { User } from "../../model/user";
import { Util } from "../../util";

export class PayloadVerifier{

    private payload: Payload;

    private logger: Logger;

    private userDB: UserDB;

    private util: Util;

    constructor(payload: Payload, logger:Logger){
        this.payload = payload;
        this.logger = logger;
        this.userDB = new UserDB(this.logger);
        this.util = new Util();
    }

    public payloadChecker = (): Promise<boolean> => {
        return new Promise((resolve, reject) => {
            try{
                this.userDB.getUser(this.payload.sendUser.username)
                .then((user: User) => {
                    const password: string  = this.util.decodeBase64(user.password? user.password: '');
                    password === this.payload.sendUser.password?.toString()? resolve(true): reject('Password is Invalid');
                }).catch(err => {
                    reject(err);
                })
            } catch(err){
                reject(err);
            }
        });
    }


}