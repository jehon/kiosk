
import Bus from '../common/bus.js';
import loggerFactory from '../common/logger.js';

const logger = loggerFactory('bus');
const bus = new Bus(logger);

export const subscribe = (name, callback) => bus.subscribe(name, callback);
export const dispatch = (name, data) => bus.dispatch(name, data);

//
// Listen from server events
//

// https://www.npmjs.com/package/sse-pusher
var osEvents = new EventSource('/core/events');

osEvents.onmessage = function (event) {
	const data = JSON.parse(event.data, JSONDateParser);
	logger.trace(`from server ${data.type}: ${JSON.stringify(data.data)}`);
	dispatch(data.type, data.data);
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

// Legacy ? -> use brol machin?
export function myFetch(url, { format, untilSuccess, interval, fetchOptions } = { format: 'json', untilSuccess: false, inteval: 5000, fetchOptions: {} }) {
	return new Promise((resolve, reject) => {
		let cron = false;
		const test =(() => {
			return fetch(url, {
				mode: 'cors',
				credentials: 'include',
				...fetchOptions
			}).then((response) => {
				if (!response.ok) {
					throw {
						code: response.status,
						text: response.statusText
					};
				}
				if (cron) {
					clearTimeout(cron);
				}
				switch(format){
				case 'response':
					return response;
				case 'json':
					return response.json();
				case 'text':
					return response.text();
				}
				throw 'unknow required format: ' + format;
			}, err => {
				if (untilSuccess) {
					cron = setTimeout(test, interval);
				} else {
					throw err;
				}
			}).then(data => resolve(data), err => reject(err));
		});
		test();
	});
}
