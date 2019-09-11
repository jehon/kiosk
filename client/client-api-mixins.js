
const isRendered = Symbol('isRendered');
const unsubscriber = Symbol('unsubscriber');

export const kioskEventListenerMixin = (app, cls) => class extends cls {
	_events = {}

	constructor(...args) {
		super(...args);
		this[isRendered] = false;
		this[unsubscriber] = [];
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
			this[unsubscriber].push(
				app.subscribe(k,
					// Callback function
					(status) => {
						if (typeof(status) != 'undefined')  {
							// Store the value locally
							this._events[k] = status;
						}
						return listing[k](status);
					})
			);
		}
	}

	disconnectedCallback() {
		for(const remover of this[unsubscriber]) {
			remover();
		}
		if (super.disconnectedCallback) {
			super.disconnectedCallback();
		}
	}

	isRendered() {
		return this[isRendered];
	}

	// Abstract
	render() {}

	// Abstract
	get kioskEventListeners() {
		return {};
	}
};
