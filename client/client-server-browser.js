import { ROUTE_EVENTS, ROUTE_NOTIFY } from "../common/constants.js";
const eventSource = new EventSource(ROUTE_EVENTS);

/**
 * @param {string} channel to be sent on
 * @param {*} data to be sent
 */
export async function guiSendToServer(channel, data) {
  return fetch(`${ROUTE_NOTIFY}/${channel}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify(data)
  });
}

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
