
import { PolymerElement, html } from '/node_modules/@polymer/polymer/polymer-element.js';
import '/node_modules/@polymer/polymer/lib/elements/dom-if.js';

import './panorama-focus.js';
import './panorama-listing.js';

export default class Panorama extends PolymerElement {
	static get properties() {
		return {
			list: Array,
			auto: Boolean,
			current: Number,
			focus: {
				type: Boolean,
				value: false
			}
		};
	}

	static get template() {
		return html`
		<x-css-inherit></x-css-inherit>
		<template is="dom-if" if="{{focus}}">
			<x-panorama-focus   list="[[list]]" current="[[current]]" auto="[[auto]]" on-unselected="onUnselected"></x-panorama-focus>
		</template>
		<template is="dom-if" if="{{!focus}}">
			<x-panorama-listing list="[[list]]" current="[[current]]" on-selected="onSelected"></x-panorama-listing>
		</template>`;
	}

	constructor() {
		super();
	}

	onSelected(event) {
		event.stopPropagation();
		console.log('Panorama selected: ', event.detail);
		this.current = event.detail.key;
		this.focus = true;
	}

	onUnselected(event) {
		event.stopPropagation();
		console.log('Panorama unselected: ', event.detail);
		this.focus = false;
		this.current = event.detail.id;
	}
}

customElements.define('x-panorama', Panorama);
