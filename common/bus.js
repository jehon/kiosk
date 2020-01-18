
const _ = require('lodash');

// Inspired from https://gist.github.com/mudge/5830382

class Bus {
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
		if (typeof(cb) != 'function') {
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
			if (eventName in this.stateValues && _.isEqual(this.stateValues[eventName], data)) {
				this.logger.debug('notify: skipping ', eventName, data);
				return ;
			}
		}
		this.stateValues[eventName] = _.cloneDeep(data);


		// Specific listeners
		// Duplicate the eventName so it appears as first parameter

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
				if (typeof(listener) != 'function') {
					this.logger.error(`Not a function for ${eventName} at ${i}: ${typeof(listener)}`, listener);
				} else {
					await listener(data);
				}
			} catch (e) {
				this.logger.error(`Error when notifying ${eventName}`, data, ': ', e);
			}
		}));
	}

	getSavedState() {
		return this.stateValues;
	}
}

module.exports = Bus;
