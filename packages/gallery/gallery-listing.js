
import { PolymerElement, html } from '/node_modules/@polymer/polymer/polymer-element.js';
import '/node_modules/@polymer/polymer/lib/elements/dom-repeat.js';

// Custom viewers
import './gallery-view-folder.js';
import './gallery-view-image.js';

export default class GalleryListing extends PolymerElement {
	static get properties() {
		return {
			url: {
				type: String,
				observer: 'updateListing'
			}
		};
	}

	static get template() {
		return html`
			<x-css-inherit></x-css-inherit>
			<div class="grid">
				<template is="dom-repeat" items="[[list]]">
					<div class="column thumb" thumb$="[[index]]">
						<div>
							<x-view 
								type="[[item.type]]" 
								height="[[thumbHeight]]"
								url="[[item.name]]"
								key="[[index]]"
								style="display: block; height: [[thumbHeight]]px"
							></x-view>
						</div>
						<div>[[item.name]]</div>
					</div>
				</template>
			</div>`;
	}

	constructor() {
		super();
		this.thumbHeight = '100';
	}

	updateListing(url) {
		console.info('Updating from ', url);

	}
}

customElements.define('gallery-listing', GalleryListing);
