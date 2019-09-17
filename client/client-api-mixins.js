
const isRendered = Symbol('isRendered');
const unsubscriber = Symbol('unsubscriber');
const mixinLogger = Symbol('mixinLogger');

export const kioskEventListenerMixin = (app, cls) => class extends cls {
	_events = {}

	constructor(...args) {
		super(...args);
		this[isRendered] = false;
		this[unsubscriber] = [];
		this[mixinLogger] = app.logger.extend('mixin');
	}

	connectedCallback() {
		if (super.connectedCallback) {
			super.connectedCallback();
		}
		if (!this[isRendered]) {
			this[isRendered] = true;
			this.render();
		}
		const listing = this.kioskEventListeners;
		for(const k in listing) {
			this[mixinLogger].debug('Registering for event ' + k);
			this[unsubscriber][k] = app.subscribe(k,
				// Callback function
				(status) => {
					if (typeof(status) != 'undefined')  {
						// Store the value locally
						this._events[k] = status;
					}
					this[mixinLogger].debug('Dispatching event ' + k);
					return listing[k](status);
				});
		}
	}

	disconnectedCallback() {
		for(const k of Object.keys(this[unsubscriber])) {
			this[mixinLogger].debug('Unregistering for event ' + k);
			this[unsubscriber][k]();
			delete(this[unsubscriber][k]);
		}
		if (super.disconnectedCallback) {
			super.disconnectedCallback();
		}
	}

	isRendered() {
		return this[isRendered];
	}

	// Abstract
	render() {
		this[mixinLogger].debug('Initial rendering');
	}

	// Abstract
	get kioskEventListeners() {
		return {};
	}
};
