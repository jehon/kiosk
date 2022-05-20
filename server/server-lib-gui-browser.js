
import express from 'express';
import { Logger } from '../common/logger.js';
import getConfig from './server-lib-config.js';
import SSE from 'express-sse'; // https://www.npmjs.com/package/express-sse
import { ROUTE_EVENTS, ROUTE_NOTIFY } from '../common/constants.js';

const expressApp = express();
const sse = new SSE();

/**
 * @type {Map<string, Array<Function>>}
 */
const listeners = new Map();

/**
 * @param {boolean} _devMode to enable de
 */
export async function guiPrepare(_devMode) {
    // Fix: TypeError: res.flush is not a function
    //   Thanks to https://github.com/dpskvn/express-sse/issues/28#issuecomment-812827462
    expressApp.use(ROUTE_EVENTS, (req, res, next) => {
        res.flush = () => { };
        next();
    }, sse.init);

    // to support JSON-encoded bodies
    expressApp.use(express.json({
        strict: false
    }));
    expressApp.post(`${ROUTE_NOTIFY}/:channel`, (req, res) => {
        const channel = req.params.channel;
        const data = req.body;
        if (listeners.has(channel)) {
            for (const cb of listeners.get(channel)) {
                cb(data);
            }
        }
        return res.send('Treated');
    });

    expressApp.use('/media', express.static('/media'));
    expressApp.use('/mnt', express.static('/mnt'));
    expressApp.use('/var/jehon/photos', express.static('/var/jehon/photos'));
    expressApp.use(express.static('.'));
}

/**
 * @param {Logger} _logger to log debug
 * @param {boolean} _devMode to enable de
 * @param {string} _url to be loaded
 */
export async function guiLaunch(_logger, _devMode, _url) {
    expressApp.get('/', (req, res) => res.redirect(_url));
    const port = getConfig('core.port', 0);

    await new Promise(resolve => {
        expressApp.listen(port, function () {
            // Thanks to https://stackoverflow.com/a/29075664/1954789
            _logger.info(`Listening on port ${this.address().port}!`);
            resolve(port);
        });
    });
}

/**
 * @param {string} eventName to be sent
 * @param {object} data to be sent
 */
export function guiDispatchToBrowser(eventName, data) {
    sse.send(data, eventName);
}

/**
 * @param {string} channel to listen to
 * @param {function(any):void} cb with message
 */
export function guiOnClient(channel, cb) {
    if (!listeners.has(channel)) {
        listeners.set(channel, []);
    }
    listeners.get(channel).push(cb);
}
