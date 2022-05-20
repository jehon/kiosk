
// import { CHANNEL_HISTORY, CHANNEL_LOG } from '../common/constants.js';
// import { loggerAsMessageListener } from './server-client.js';
import { guiDispatchToBrowser, guiLaunch, guiOnClient, guiPrepare } from './server-lib-gui-electron.js';

const historySent = new Map();

/**
 * @param {module:server/ServerApp} serverApp for logging purpose
 */
export async function start(serverApp) {
    const logger = serverApp.childLogger('gui');
    const devMode = serverApp.getConfig('server.devMode');
    if (devMode) {
        logger.debug('Enabling dev mode');
    }

    const url = 'client/index.html';
    // const url = `http://localhost:${app.getConfig('.webserver.port')}/client/index.html`;

    await guiPrepare(devMode);


    await guiLaunch(logger, devMode, url);
}

/**
 * @param {string} channel to listen to
 * @param {function(any):void} cb with message
 */
export function onClient(channel, cb) {
    guiOnClient(channel, cb);
}

/**
 * @param {string} eventName to be sent
 * @param {object} data to be sent
 */
export function dispatchToBrowser(eventName, data) {
    historySent.set(eventName, data);
    guiDispatchToBrowser(eventName, data);
}
