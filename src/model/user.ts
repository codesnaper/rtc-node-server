import { UserStatus } from "./statusEnum";

export interface User {
    firstname?: string;
    lastname?: string;
    email?: string;
    password?: string;
    username: string;
    status?: UserStatus;
    connectionId?: string;
    _id?: string;
    freinds?: string[];
}