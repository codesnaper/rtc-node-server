import { JsonDB, Config } from "node-json-db";
import { Logger } from "winston";
import { Notification } from "../model/notification";
import { User } from "../model/user";
import conf from "./../conf";

export class NotificationDB{

    private notificationDB: JsonDB;

    private logger: Logger;
    
    constructor(logger: Logger){
        this.notificationDB = new JsonDB(new Config(conf["notification-db"], true, true, '/'));
        this.logger = logger;
        this.logger.info('Notification DB initialized successfully');
    }

    public addNotificationToUser = async(user: User, notification: Notification) => {
        try{
            let notifications:Notification[] | undefined = await this.notificationDB.getData(`/${user}`);
            if(notifications == undefined){
                notifications = [];
            }
            notifications.push(notification);
            await this.notificationDB.push(`/${user}`, notifications, false );
            this.logger.child({notificationUser: user}).debug('Notification added successfully to user');
        } catch(err) {
            this.logger.child({notificationUser: user, err: JSON.stringify(err)}).error('Failed in updating notifications');
            throw new Error('Failed in updating notifications');
        }
    }

}