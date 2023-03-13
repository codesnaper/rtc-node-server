const  { v4 } = require('uuid');
const { createLogger, format, transports } = require("winston");

const logLevels = {
    fatal: 0,
    error: 1,
    warn: 2,
    info: 3,
    debug: 4,
    trace: 5,
  };

const id = v4();
module.exports = class Util{
    encodeBase64 = (value) => {
        const buffer = new Buffer(value);
        return buffer.toString('base64');
    }
    decodeBase64 = (value) => {
        const buffer = new Buffer(value, 'base64');
        return buffer.toString('ascii');
    }

    log = (metaData , ctx)=> {
        console.log(id);
        if(ctx == null){
            ctx = {};
        }
        ctx['trace-id'] = id;
        const logger = createLogger({
            levels: logLevels,
            format: format.combine(format.timestamp(), format.json()),
            defaultMeta: metaData,
            transports: [new transports.Console({}), new transports.File({ filename: "log/server.log" })],
            exceptionHandlers: [new transports.File({ filename: "log/exceptions.log" })],
            rejectionHandlers: [new transports.File({ filename: "log/rejections.log" })],
          });
          return logger.child({ context: ctx });
    }
}