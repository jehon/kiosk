
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
