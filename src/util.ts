import { v4 } from "uuid";
import { createLogger, Logger, transports, format } from "winston";
import conf from "./conf";
const logLevels = {
    fatal: 0,
    error: 1,
    warn: 2,
    info: 3,
    debug: 4,
    trace: 5,
  };

const id = v4();
export class Util{
    public encodeBase64 = (value: string): string => {
        const buffer = new Buffer(value);
        return buffer.toString('base64');
    }
    public decodeBase64 = (value: string): string => {
        const buffer = new Buffer(value, 'base64');
        return buffer.toString('ascii');
    }

    public log = (metaData: any , ctx: any | undefined = undefined): Logger=> {
        if(ctx == undefined){
            ctx = {};
        }
        ctx['trace-id'] = id;
        const logger = createLogger({
            levels: logLevels,
            format: format.combine(format.timestamp(), format.json()),
            defaultMeta: metaData,
            transports: [new transports.Console({}), new transports.File({ filename: conf["log-app-file"] })],
            exceptionHandlers: [new transports.File({ filename: conf["log-exception-file"] })],
            rejectionHandlers: [new transports.File({ filename: conf["log-rejection-file"] })],
          });
          return logger.child({ context: ctx });
    }
}