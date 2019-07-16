
import { PolymerElement } from '/node_modules/@polymer/polymer/polymer-element.js';

import './view-generic.js';
import './view-folder.js';
import './view-image.js';

export default class View extends PolymerElement {
	static get properties() {
		return {
			type: String,
			url: String,
			height: Number,
			key: String
		};
	}

	static get template() {
		return null;
	}

	constructor() {
		super();
	}

	attributeChangedCallback(...args) {
		super.attributeChangedCallback(...args);
		this.ready();
	}

	ready() {
		let constructor = customElements.get('x-view-' + this.type);
		if (constructor == null) {
			// console.warn(`No constructor found for ${this.type}`);
			constructor = customElements.get('x-view-generic');
		}
		const el = new (constructor)();
		el.setAttribute('url', this.url);
		el.setAttribute('height', this.height);
		el.setAttribute('key', this.key);
		this.innerHTML = '';
		this.insertAdjacentElement('beforeend', el);
	}
}

customElements.define('x-view', View);
