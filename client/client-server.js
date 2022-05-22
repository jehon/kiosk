
import { CHANNEL_LOG } from '../common/constants.js';
import { guiOnServerMessage, guiSendToServer } from './client-server-browser.js';

/**
 * @param {*} data to be sent
 */
export function sendLogToServer(data) {
    sendToServer(CHANNEL_LOG, data);
}

/**
 * @param {string} channel to be sent on
 * @param {*} data to be sent
 */
export async function sendToServer(channel, data) {
    return guiSendToServer(channel, data);
}

/**
 *
 * @param {string} channel to listen to
 * @param {function(object):void} cb to react to events
 */
export function onServerMessage(channel, cb) {
    guiOnServerMessage(channel, cb);
}

// /**
//  * Reset cache.
//  * See http://seenaburns.com/debugging-electron-memory-usage/
//  */
// import TimeInterval from '../common/TimeInterval.js';
// const { webFrame } = require('electron');
// new TimeInterval(() => webFrame.clearCache(), 2 * 60 * 1000).start();
