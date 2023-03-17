import { MongoClient, Db, Collection } from "mongodb";
import { Logger } from "winston";
import conf from "../conf";
import { User } from "../model/user";

export class MongoDB {

    private logger: Logger;

    private static instance: MongoDB;

    private database: Db;

    private userCollection: Collection<User>;

    private static client: MongoClient;

    constructor(logger: Logger) {
        this.logger = logger;
        this.logger.info('User DB initialized successfully');
        MongoDB.client = new MongoClient(conf["db-url"], { monitorCommands: true, maxPoolSize: 2, minPoolSize: 1 });
        this.database = MongoDB.client.db('rtc-db')
        this.userCollection = this.database.collection('user');
    }

    public static getInstance(logger: Logger): MongoDB {
        if (!MongoDB.instance) {
            MongoDB.instance = new MongoDB(logger);
        }
        return MongoDB.instance;
    }

    public getUserCollection(): Collection<User> {
        return this.userCollection;
    }

    public closeConnection() {
        MongoDB.client.close(true).then(() =>{
            console.log('close connection')
            process.exit(0);
        });
    }
}