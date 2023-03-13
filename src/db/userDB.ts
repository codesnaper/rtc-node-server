import { Config, JsonDB } from "node-json-db";
import { Logger } from "winston";
import { UserStatus } from "../model/statusEnum";
import { User } from "../model/user";
import conf from "./../conf";

export class UserDB {

    private userDB: JsonDB;

    private logger: Logger;

    constructor(logger: Logger) {
        this.userDB = new JsonDB(new Config(conf["user-db"], true, true, '/'));
        this.logger = logger;
        this.logger.info('User DB initialized successfully');
    }

    public getAllUser = async () : Promise<User[]> => {
        try {
            const users: Promise<User[]> =  await this.userDB.getData("/");
            return users;
        } catch (err) {
            this.logger.child({ err: JSON.stringify(err) }).error('Failed in fetching all user from DB');
            throw new Error('Failed in fetching all user from DB');
        }
    }

    public getUser =  async (username: string): Promise<User> => {
        try {
            const data : Promise<User> =  await this.userDB.getData(`/${username}`);
            this.logger.child({ 'Fetch User Name': username }).debug('Fetched user from DB');
            return data;
        } catch (err) {
            this.logger.child({ 'Fetch User Name': username, err: JSON.stringify(err) }).error('Failed in fetching user from DB');
            throw new Error('Failed in fetching user from DB');
        }
    }

    public updateUserStatus = async (userStatus: UserStatus, username: string): Promise<void>  => {
        try {
            await this.userDB.push(`/${username}`, { status: userStatus }, false);
        } catch (err) {
            this.logger.child({ 'Fetch User Name': username, err: JSON.stringify(err) }).error(`Failed in updating status for ${username}`);
            throw new Error(`Failed in updating status for ${username}`);
        }
    }

    public updateConnectionId = async (connectionId: string, username: string): Promise<void> => {
        try {
            await this.userDB.push(`/${username}`, { connectionId: connectionId }, false);
        } catch (err) {
            this.logger.child({ 'Fetch User Name': username, err: JSON.stringify(err) }).error(`Failed in updating connection id for ${username}`);
            throw new Error(`Failed in updating connection id for ${username}`);
        }
    }

    public deleteConnectionId = async (username: string): Promise<void> => {
        try {
            const user: User = await this.getUser(username);
            delete user.connectionId;
            await this.userDB.push(`/${username}`, user, true);
        } catch (err) {
            this.logger.child({ 'Fetch User Name': username, err: JSON.stringify(err) }).error(`Failed in removing connection is for ${username}`);
            throw new Error(`Failed in updating connection id for ${username}`);
        }
    }

}