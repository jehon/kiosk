
// TODO
// import _ from '../node_modules/lodash/lodash.js';

// Inspired from https://gist.github.com/mudge/5830382

function clone(obj) {
	if(obj == null || typeof(obj) != 'object') {
		return obj;
	}

	var temp = new obj.constructor();

	for(var key in obj) {
		if (Object.prototype.hasOwnProperty.call(obj, key)) {
			// eslint-disable-next-line no-prototype-builtins
			// if (obj.hasOwnProperty(key)) {
			temp[key] = clone(obj[key]);
		}
	}

	return temp;
}

export class Bus {
	constructor(logger = console) {
		this.logger = logger;
		this.events = {};
		this.stateValues = {};
	}

	/**
	 * Register a listener on events
	 *
	 * @param {string} eventName
	 * @param {function(eventName, data) {}} cb
	 */
	subscribe(eventName, cb) {
		if (!( cb instanceof Function)) {
			throw `Subscribing to ${eventName} with something that is not a function: ${cb}`;
		}

		if (eventName in this.stateValues) {
			cb(this.stateValues[eventName]);
		}

		if (typeof this.events[eventName] !== 'object') {
			this.events[eventName] = {};
		}

		const s = Symbol('bus ' + eventName);
		this.events[eventName][s] = cb;

		return () => delete this.events[eventName][s];
	}

	/**
	 * Send a notification to the system
	 *
	 * If data is specified:
	 * - the notification is related to a 'status'
	 * - status is only fired on change
	 * - status is fired on registration
	 *
	 * @param {string} eventName: the name of the event
	 * @param {*} data: the associated data
	 */
	async dispatch(eventName, data) {
		this.logger.debug(`Nofity ${eventName}`, data);
		if (typeof(data) != 'undefined') {

			if (eventName in this.stateValues
					&& (
						JSON.stringify(this.stateValues[eventName], Object.keys(this.stateValues[eventName]).sort())
					== JSON.stringify(data, Object.keys(data).sort()))) {
				this.logger.debug('notify: skipping ', eventName, data);
				return ;
			}
		}
		this.stateValues[eventName] = clone(data);

		if (!(eventName in this.events)) {
			return;
		}

		const eListeners = this.events[eventName];

		// Wait for all to have managed the result
		return await Promise.all(Object.getOwnPropertySymbols(eListeners).map(async i => {
			const listener = eListeners[i];
			try {
				// The listener is called "sync", ie. the result is sent back synchronously
				// as a Promise. If we make promise.then, then it become async
				await listener(data);
			} catch (e) {
				this.logger.error(`Error when notifying ${eventName}`, data, ': ', e);
			}
		}));
	}

	getSavedState() {
		return this.stateValues;
	}
}
