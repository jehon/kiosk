
const { ipcRenderer } = require('electron');

/**
 * @param {string} channel to be sent on
 * @param {*} data to be sent
 */
export function guiSendToServer(channel, data) {
  ipcRenderer.send(channel, data);
}

/**
 *
 * @param {string} channel to listen to
 * @param {function(object):void} cb to react to events
 */
export function guiOnServerMessage(channel, cb) {
  ipcRenderer.on(channel, (_event, message) => cb(message));
}
