module.exports = class Util{
    encodeBase64 = (value) => {
        const buffer = new Buffer(value);
        return buffer.toString('base64');
    }
    decodeBase64 = (value) => {
        const buffer = new Buffer(value, 'base64');
        return buffer.toString('ascii');
    }
}