
const isRendered = Symbol('isRendered');
export const renderMixin = (cls) => class extends cls {
	constructor(...args) {
		super(...args);
		this[isRendered] = false;
	}

	connectedCallback() {
		if (super.connectedCallback) {
			super.connectedCallback();
		}
		if (!this[isRendered]) {
			this[isRendered] = true;
			this.render();
		}
	}

	isRendered() {
		return this[isRendered];
	}

	// Abstract
	render() {}
};

const unsubscriber = Symbol('unsubscriber');
export const kioskEventListenerMixin = (app, cls) => class extends cls {
	_events = {}

	constructor(...args) {
		super(...args);
		this[unsubscriber] = [];
	}

	connectedCallback() {
		if (super.connectedCallback) {
			super.connectedCallback();
		}
		const listing = this.kioskEventListeners;
		for(const k in listing) {
			this.kioskSubscribe(k, (status) => {
				if (typeof(status) != 'undefined')
					this._events[k] = status;
				return listing[k](status);
			});
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

	// Abstract
	get kioskEventListeners() {
		return {};
	}

	kioskSubscribe(eventName, cb) {
		this[unsubscriber].push(app.subscribe(eventName, cb));
	}
};
