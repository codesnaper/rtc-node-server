export type APIError = {
    message: string,
    systemError?: any,
    code?: number,
    operation: string
}