import { User } from "./user";

export interface Notification {
    message: string;
    unread: boolean;
    date: Date;
    fromUser?: User
    toUser: User;
}