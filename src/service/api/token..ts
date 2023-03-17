import {  readFileSync } from 'fs';
import { sign,SignOptions, verify, VerifyErrors, VerifyOptions , Jwt} from 'jsonwebtoken';
import { v4 } from 'uuid';
import { Logger } from 'winston';
import conf from '../../conf';
import { User } from '../../model/user';


export class Token {

    private logger: Logger;

    constructor(logger: Logger){
        this.logger = logger;
    }

    generateToken = (user: User): Promise<string> => {
        return new Promise((resolve, reject) => {
            const privateKey = readFileSync(conf['private-key-file']);
            const signOptions: SignOptions = {
                algorithm: 'RS256',
                expiresIn: '1d',
                jwtid: v4(),
            }
            const token = sign(
                user, privateKey, signOptions, (err: Error | null, token) => {
                    if(err != null){
                        this.logger.error(err.message);
                        reject('Fail to login due to server error');
                    } else{
                        resolve(`${token}`);
                    }
            });
        });
    }

    verifyToken =(token: string): Promise<User> => {
        return new Promise((resolve, reject) => {
            const verfifyOption: VerifyOptions = {
                algorithms: ['RS256']
            }
            const cert = readFileSync(conf['public-key-file']);
            verify(token, cert, verfifyOption, (err: VerifyErrors| null , decoded: any) => {
                if(err == null){
                    const user: User = decoded as User;
                    user.password = 'xxxxxxx';
                    resolve(user);
                } else{
                    reject(err);
                }
            });
        })
    }
}