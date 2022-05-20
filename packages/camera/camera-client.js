
import ClientElement from '../../client/client-element.js';
import { ClientApp } from '../../client/client-app.js';
import { priorities } from '../../client/config.js';

import { TriStates } from './constants.js';

const app = new ClientApp('camera');

// TODO: manage http errors

// TODO: handle when the app is selected, but the camera is not available
//  --> it should show an error message

export class KioskCameraMainElement extends ClientElement {
	actualUrl = '';

	// connectedCallback() {
	// 	super.connectedCallback();
	// 	// this.innerHTML = '<video style="width: 95%; height: 95%" autoplay=1 preload="none" poster="../packages/camera/camera.png" ><source src=""></source></video>';

	// 	// First load an IFrame to trigger authentication
	// 	// this.innerHTML = `<iframe style='width: 1px; height: 1px; position: absolute; left: -100px' src='${status.host + status.videoFeed + '?' + Date.now()}'></iframe>`;

	// 	// We need the iframe to be loaded for the 'login' event to happen
	// 	// setTimeout(() => {
	// 	// this.innerHTML = `<div class='full full-background-image' style='background-image: url("${status.host + status.videoFeed}?${Date.now()}")'></div>`;
	// 	// this.innerHTML = `<div class='full full-background-image' style='background-image: url("/camera/feed?${Date.now()}")'></div>`;
	// 	// }, 2000);
	// }

	disconnectedCallback() {
		super.disconnectedCallback();

		// Avoid background load
		const v = this.shadowRoot.querySelector('video');
		if (v) {
			v.src = '';
			v.load();
		}
		this.shadowRoot.innerHTML = '';
	}

	/** @override */
	stateChanged(status) {
		if (!status || !status.server) {
			return;
		}

		//
		// - status.server.code = the new status coming from the server
		// - statusCode = the previous status
		// - statusUrl = the previous url
		//
		if (status.server.code == TriStates.READY && status.server.url) {
			const newUrl = (status.server.url ?? '').replace('localhost', window.location.hostname);
			app.debug('Adapt: up', status.server, this.actualUrl, newUrl);

			// Live event
			if (newUrl != this.actualUrl) {
				app.debug('Adapt: go live');
				this.actualUrl = newUrl;
				this.shadowRoot.innerHTML = `<video style="width: 95%; height: 95%" autoplay=1 preload="none" poster="../packages/camera/camera.png" ><source src="${this.actualUrl}"></source></video>`;
			}
		} else {
			app.debug('Adapt: down');
			if (this.actualUrl != '') {
				app.debug('Adapt: saying it once');
				this.shadowRoot.innerHTML = 'Camera is down: ' + JSON.stringify(status.server);
				this.actualUrl = '';
			}
			this.actualUrl = '';
		}
	}
}
customElements.define('kiosk-camera-main-element', KioskCameraMainElement);

export class KioskCameraStatusElement extends ClientElement {
	ready() {
		this.shadowRoot.innerHTML = `
			<style>
				img {
					max-width: 100%;
					max-height: 100%;
					object-fit: contain;
				}
			</style>
			<img src="../packages/camera/camera.png" />
		`;
	}

	stateChanged(status) {
		if (!status || !status.server) {
			return;
		}
		switch (status.server.code) {
			case TriStates.READY:
				this.toggleAttribute('disabled', true);
				// this.style.backgroundColor = 'green';
				break;
			case TriStates.UP_NOT_READY:
				this.toggleAttribute('disabled', false);
				this.style.backgroundColor = 'orange';
				break;
			case TriStates.DOWN:
				this.toggleAttribute('disabled', true);
				// this.style.backgroundColor = 'red';
				break;
		}
	}
}
customElements.define('kiosk-camera-status-element', KioskCameraStatusElement);

app
	.setState({ code: TriStates.DOWN })
	.setMainElementBuilder(() => new KioskCameraMainElement())
	.menuBasedOnIcon('../packages/camera/camera.png')
	.setStatusElement(new KioskCameraStatusElement());

app
	.onStateChange((status, app) => {
		app.debug('Status received', status);
		if (!status || !status.server) {
			return;
		}
		switch (status.server.code) {
			case TriStates.READY:
				app.debug('ServerStateChanged: up, high priority', status.server.message);
				app.setPriority(priorities.camera.elevated);
				break;
			case TriStates.UP_NOT_READY:
				app.debug('ServerStateChanged: warming up', status.server.message);
				app.setPriority(priorities.camera.normal);
				break;
			case TriStates.DOWN:
				app.debug('ServerStateChanged: down', status.server.message);
				app.setPriority(priorities.camera.normal);
				break;
		}
	});
export default app;
