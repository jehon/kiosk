
import ClientAPIFactory from './client-api.js';

const app = ClientAPIFactory('core-api-evnets');

//
// Listen from server events
//

// https://www.npmjs.com/package/sse-pusher
var osEvents = new EventSource('/core/events');

osEvents.onmessage = function (event) {
	const data = JSON.parse(event.data, JSONDateParser);
	app.debug(`from server ${data.type}:`, data.data);
	app.dispatch(data.type, data.data);
};

// Use by osEvents.onmessage here, available for external use
export function JSONDateParser(key, value) {
	const reISO = /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2}):(\d{2}(?:\.\d*))(?:Z|(\+|-)([\d|:]*))?$/;

	if (typeof value === 'string') {
		if (reISO.exec(value)) {
			return new Date(value);
		}
	}
	return value;
}
