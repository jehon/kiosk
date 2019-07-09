
import { PolymerElement, html } from '/node_modules/@polymer/polymer/polymer-element.js';
import '/node_modules/@polymer/polymer/lib/elements/dom-if.js';
import '/node_modules/@polymer/polymer/lib/elements/dom-repeat.js';

// Custom viewers
import './gallery-listing.js';
import './gallery-view-folder.js';
import './gallery-view-image.js';

//
// How to do that ?
//  -> server serve the browser.html ?
//  -> we create an app here and give him a root ?
//      -> how to specify the root ?
//

import AppFactory from '../../client/client-api.js';
const app = AppFactory('gallery');

class KioskGallery extends PolymerElement {
	// TODO: adapt to "mount" signals -> extends Kiosk...Listener
	// get kioskEventListeners() {
	// 	return {
	// 		'.second': () => this.adapt()
	// 	};
	// }

	static get properties() {
		return {
			src: {
				type: String,
				value: '/'
			},
			current: {
				type: String,
				value: '/'
			}
		};
	}

	static get template() {
		return html`
			Client Gallery [[current]]
			<gallery-listing url='[[current]]'>
			</gallery-listing>
		`;
	}

	constructor() {
		super();
		this.thumbHeight = '100';
	}}

customElements.define('kiosk-gallery', KioskGallery);

app
	.withPriority(5010)
	.withMainElement(new KioskGallery())
	.menuBasedOnIcon('/packages/gallery/gallery.png', 'Browser')
;
