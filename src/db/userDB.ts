import { Logger } from "winston";
import { Collection, UpdateResult, WithId, Filter } from "mongodb";
import { User } from "../model/user";
import { MongoDB } from "./mongoDB";
import { UserStatus } from "../model/statusEnum";

export class UserDB {

    private userCollection: Collection<User>;

    private logger: Logger;

    constructor(logger: Logger) {
        this.logger = logger;
        this.logger.info('User DB initialized successfully');
        this.userCollection = MongoDB.getInstance(this.logger).getUserCollection();
    }

    public addUser = async (user: User): Promise<any> => {
        return new Promise((resolve, reject) => {
            this.userCollection.insertOne(user)
                .then(() => resolve(true))
                .catch(err => reject(err))
        });
    };

    public getAllUser = async (): Promise<User[]> => {
        return new Promise((resolve, reject) => {
            this.userCollection.find().toArray()
                .then((users: WithId<User>[]) => {
                    resolve(users);
                })
                .catch((err) => reject(err));
        });
    }

    public getUser = (username: string): Promise<User> => {
        return new Promise((resolve, reject) => {
            this.userCollection.find({ username: { $eq: `${username}` } })
                .toArray()
                .then((users: WithId<User>[]) => {
                    if (users.length === 0) {
                        throw new Error('User not found!!!');
                    }
                    resolve(users[0]);
                })
                .catch((err) => reject(err));
        });
    }

    public updateUserStatus = (userStatus: UserStatus, username: string): Promise<any> => {
        return new Promise((resolve, reject) => {
            const userNameQuery: Filter<User> = { username: { $eq: `${username}` } };
            const updateStatusValue: Filter<User> = {
                $set: { "status": `${userStatus}` }
            };
            this.userCollection.updateOne(userNameQuery, updateStatusValue)
                .then((result: UpdateResult) => {
                    if (!result.acknowledged) {
                        throw new Error('Not able to update status as username not found.')
                    }
                    resolve(true)
                }).catch((err) => reject(err));

        });
    }

    public updateConnectionId = (connectionId: string, username: string): Promise<any> => {
        return new Promise((resolve, reject) => {
            const userNameQuery: Filter<User> = { username: { $eq: `${username}` } };
            const updateConnectionid: Filter<User> = {
                $set: { connectionId: `${connectionId}` }
            };
            this.userCollection.updateOne(userNameQuery, updateConnectionid)
                .then((result: UpdateResult) => {
                    if (!result.acknowledged) {
                        throw new Error('Not able to update connection id as username not found.')
                    }
                    resolve(true)
                }).catch((err) => reject(err));
        });
    }

    public deleteConnectionId = (username: string): Promise<any> => {
        return new Promise((resolve, reject) => {
            const userNameQuery: Filter<User> = { username: { $eq: `${username}` } };
            const updateConnectionid: Filter<User> = {
                $unset: { connectionId: `` }
            };
            this.userCollection.updateOne(userNameQuery, updateConnectionid)
                .then((result: UpdateResult) => {
                    if (!result.acknowledged) {
                        throw new Error('Not able to update connection id as username not found.')
                    }
                    resolve(true)
                }).catch((err) => reject(err));
        });
    }
}