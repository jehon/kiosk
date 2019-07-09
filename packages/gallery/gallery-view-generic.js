
import { PolymerElement, html } from '/node_modules/@polymer/polymer/polymer-element.js';

export default class GalleryViewGeneric extends PolymerElement {
	static get properties() {
		return {
			type: String,
			url: String,
			height: Number,
			key: String
		};
	}

	static get template() {
		return html`
		<x-css-inherit></x-css-inherit>
		<img
			on-click='onClick'
			is='kiosk-img-loading'
			src$='[[getImageUrl(url, height)]]'
			style='height: 100%; object-fit: contain'
			></img>`;
	}

	getImageUrl(_url, _height) {
		return '/packages/gallery/question.svg';
	}

	onClick() {
		this.dispatchEvent(new CustomEvent('selected', {
			detail: { key: this.key },
			bubbles: true,
			composed: true
		}));
	}
}

customElements.define('gallery-view-generic', GalleryViewGeneric);
