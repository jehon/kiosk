
import { subscribe } from './client-api-events.js';
import contextualize from '../common/contextualize.js';

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
const c = Symbol('contextualizator');
const scope = Symbol('scope');
export const kioskEventListenerMixin = (scope_, cls) => class extends cls {
	constructor(...args) {
		super(...args);
		this[c] = contextualize(scope_);
		this[unsubscriber] = [];
		this[scope] = scope_;
	}

	connectedCallback() {
		if (super.connectedCallback) {
			super.connectedCallback();
		}
		const listing = this.kioskEventListeners;
		for(const k in listing) {
			this.kioskSubscribe(k, listing[k]);
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
		this[unsubscriber].push(subscribe(this[c](eventName), cb));
	}
};
