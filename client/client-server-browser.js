import { ROUTE_EVENTS } from "../common/constants.js";
const eventSource = new EventSource(ROUTE_EVENTS);

/**
 *
 * @param {string} channel to listen to
 * @param {function(object):void} cb to react to events
 */
export function guiOnServerMessage(channel, cb) {
  eventSource.addEventListener(channel, function (event) {
    let data = event.data;
    try {
      data = JSON.parse(data);
    } catch (e) {
      // ok
    }
    cb(data);
  });
}
