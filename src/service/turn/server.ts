import TurnServer from "node-turn";
import { v4 } from "uuid";
import { Logger } from "winston";
import conf from "../../conf";
import { UserDB } from "../../db/userDB";
import { LoginUser } from "../../model/Login";
import { User } from "../../model/user";
import { Util } from "../../util";

export class AppTurnServer {

    private id: string;

    private logger: Logger;

    private userDB: UserDB;

    private util: Util = new Util();

    private server: TurnServer = new TurnServer({
        authMech: 'long-term',
        debugLevel: "ALL"
    });

    constructor() {
        this.id = v4();
        this.logger = this.util.log({ application: conf["turn-app-name"] }, { uid: this.id })
        this.userDB = new UserDB(this.logger);
    }

    private loadUserInServer = (): void => {
        this.userDB.getAllUser()
            .then((users) => {
                const map: Map<string, User> = new Map(Object.entries(users));
                Object.keys(users).forEach(username => {
                    this.logger.info(`Add user ${username} to turn server`)
                    this.server.addUser(username, new Util().decodeBase64(`${map.get(username)?.password}`));
                });
            }).catch(err => {
                this.logger.child({'errMessage': err}).error(`Fail to add user to turn server`)
            });
    }

    public addUser = (user:LoginUser): void => {
        this.server.addUser(user.username, user.password);
    }

    public removeUser = (user:LoginUser): void => {
        this.server.removeUser(user.username);
    }

    public createServer = () => {
        this.loadUserInServer();
        this.server.start();
    }
}