
const path = require('path');
const fs = require('fs');

const logFile = path.join(__dirname, 'tmp/app/log.log');
const startTS = Date.now();

try {
    fs.truncateSync(logFile);
} catch (e) {
    true;
}

/**
 * @see https://stackoverflow.com/a/29581862/1954789
 *
 * @returns {string} the calling filename
 */
function _getCallerFileAndLine() {
    var originalFunc = Error.prepareStackTrace;

    var caller = '';
    try {
        var err = new Error();
        var currentfile;

        Error.prepareStackTrace = function (err, stack) { return stack; };
        currentfile = err.stack.shift().getFileName();

        while (err.stack.length) {
            caller = err.stack.shift();
            if (currentfile !== caller.getFileName()) break;
        }

        Error.prepareStackTrace = originalFunc;

        let callerfile = caller.getFileName();
        if (callerfile.startsWith('internal')) {
            callerfile = currentfile;
        }

        callerfile = callerfile.replace('file:', '');
        callerfile = path.relative(process.cwd(), callerfile);

        return callerfile + '#' + caller.getLineNumber();

    } catch (e) {
        true;
    }
    return '?';
}

/**
 * @param {number} f to be formatted
 * @param {number} ent before .
 * @param {number} dec after .
 * @returns {string} the eeeee.ddd number
 */
function floatAlign(f, ent = 5, dec = 3) {
    const n = `${Math.round(f * Math.pow(10, dec))}`.padStart(ent + dec, '0');
    const r = n.substr(0, ent) + '.' + n.substr(ent);
    return r;
}

/**
 * @param {any} msg the message
 */
function dbg(...msg) {
    const fmsg = floatAlign((Date.now() - startTS) / 1000)
        + _getCallerFileAndLine().padEnd(30)
        + ((msg.length > 0) ?
            (': '
                + msg
                    .map(v => typeof (v) == 'object' ? JSON.stringify(v) : v)
                    .join(' '))
            : '')
        + '\n';

    fs.appendFileSync(logFile, fmsg);
    console.log(fmsg); /* eslint-disable-line */
}

module.exports = dbg;
global.dbg = dbg;

dbg('Starting the application', (new Date()).toISOString());
