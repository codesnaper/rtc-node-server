import { User } from "./user";

export interface Payload{
    type: PayloadType,
    recieverUserName: string,
    sendUser: User,
    offer?: any,
    answer?: any,
    message?: string;
}

export enum PayloadType{
    online, offline, answer, denied,offer, error, success, ring
}