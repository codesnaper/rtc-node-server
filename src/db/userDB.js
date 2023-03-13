const { JsonDB, Config } = require("node-json-db");

module.exports = class UserDB {

    constructor(logger) {
        this.userDB = new JsonDB(new Config("user", true, true, '/'));
        this.logger = logger;
        this.logger.info('User DB initialized successfully');
    }

    getAllUser = async () => {
        try {
            return await this.userDB.getData("/");
        } catch (err) {
            this.logger.child({ 'Fetch User Name': user, err: JSON.stringify(err) }).error('Failed in fetching all user from DB');
            throw new Error('Failed in fetching all user from DB');
        }
    }

    getUser = async (user) => {
        try {
            this.logger.child({ 'Fetch User Name': user }).debug('Fetching user from DB');
            return await this.userDB.getData(`/${user}`);
        } catch (err) {
            this.logger.child({ 'Fetch User Name': user, err: JSON.stringify(err) }).error('Failed in fetching user from DB');
            throw new Error('Failed in fetching user from DB');
        }
    }

    updateUserStatus = async (userStatus, username) => {
        try {
            await this.userDB.push(`/${username}`, { status: userStatus }, false);
        } catch (err) {
            this.logger.child({ 'Fetch User Name': user, err: JSON.stringify(err) }).error(`Failed in updating status for ${username}`);
            throw new Error(`Failed in updating status for ${username}`);
        }
    }

    updateConnectionId = async (connectionId, username) => {
        try {
            await this.userDB.push(`/${username}`, { connectionId: connectionId }, false);
        } catch (err) {
            this.logger.child({ 'Fetch User Name': user, err: JSON.stringify(err) }).error(`Failed in updating connection id for ${username}`);
            throw new Error(`Failed in updating connection id for ${username}`);
        }
    }

    deleteConnectionId = async (username) => {
        try {
            const user = this.getUser(username);
            delete user.connectionId;
            await this.userDB.push(`/${username}`, user, true);
        } catch (err) {
            this.logger.child({ 'Fetch User Name': user, err: JSON.stringify(err) }).error(`Failed in removing connection is for ${username}`);
            throw new Error(`Failed in updating connection id for ${username}`);
        }
    }

}