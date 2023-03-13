import { UserStatus } from "./statusEnum";

export interface User {
    password?: string;
    username: string;
    status?: UserStatus;
    connectionId?: string;
}