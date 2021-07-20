
import { LOG_CHANNEL_NAME } from '../common/config.js';

const { ipcRenderer } = require('electron');

/**
 * @param {*} data to be sent
 */
export function sendLogToServer(data) {
    sendToServer(LOG_CHANNEL_NAME, data);
}

/**
 * @param {string} channel to be sent on
 * @param {*} data to be sent
 */
export function sendToServer(channel, data) {
    ipcRenderer.send(channel, data);
}

// /**
//  * Reset cache.
//  * See http://seenaburns.com/debugging-electron-memory-usage/
//  */
// import TimeInterval from '../common/TimeInterval.js';
// const { webFrame } = require('electron');
// new TimeInterval(() => webFrame.clearCache(), 2 * 60 * 1000).start();
