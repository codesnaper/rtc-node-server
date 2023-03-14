import { UserStatus } from "./statusEnum";
import { User } from "./user";

export interface Payload{
    type: PayloadType,
    recieverUserName: string,
    sendUser: User,
    offer?: any,
    answer?: any,
    message?: string;
    status?: UserStatus;
}

export enum PayloadType{
    status, answer, denied,offer, error, success, ring
}