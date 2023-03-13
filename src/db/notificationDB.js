const { JsonDB, Config } = require("node-json-db");

module.exports = class NotificationDB{
    
    constructor(logger){
        this.notificationDB = new JsonDB(new Config("notification", true, true, '/'));
        this.logger = logger;
        this.logger.info('Notification DB initialized successfully');
    }

    addNotificationToUser = async(user, notification) => {
        try{
            let notifications = await this.notificationDB.getData(`/${user}`);
            if(notifications == null){
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