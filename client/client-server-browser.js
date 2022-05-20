
import { ROUTE_EVENTS, ROUTE_NOTIFY } from '../common/constants.js';
const sse = new EventSource(ROUTE_EVENTS);

/**
 * @param {string} channel to be sent on
 * @param {*} data to be sent
 */
export async function guiSendToServer(channel, data) {
    return fetch(`${ROUTE_NOTIFY}/${channel}`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
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
    sse.addEventListener(channel, function (event) {
        let data = event.data;
        try {
            data = JSON.parse(data);
        } catch (e) {
            // ok
        }
        cb(data);
    });
}

// /**
//  * Reset cache.
//  * See http://seenaburns.com/debugging-electron-memory-usage/
//  */
// import TimeInterval from '../common/TimeInterval.js';
// const { webFrame } = require('electron');
// new TimeInterval(() => webFrame.clearCache(), 2 * 60 * 1000).start();
