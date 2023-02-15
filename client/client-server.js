import { guiOnServerMessage } from "./client-server-browser.js";

/**
 *
 * @param {string} channel to listen to
 * @param {function(object):void} cb to react to events
 */
export function onServerMessage(channel, cb) {
  guiOnServerMessage(channel, cb);
}
