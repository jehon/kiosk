
/* global toastr */

import { ClientApp, ClientAppElement } from '../../client/client-app.js';

import { TriStates } from './constants.js';

// TODO: manage http errors

// TODO: handle when the app is selected, but the camera is not available
//  --> it should show an error message

const app = new ClientApp('camera');
export default app;

let toastrElement = null;

class KioskCamera extends ClientAppElement {
	constructor() {
		super();
		this.actualUrl = '';

		// this.innerHTML = '<video style="width: 95%; height: 95%" autoplay=1 preload="none" poster="../packages/camera/camera.png" ><source src=""></source></video>';

		// First load an IFrame to trigger authentication
		// this.innerHTML = `<iframe style='width: 1px; height: 1px; position: absolute; left: -100px' src='${status.host + status.videoFeed + '?' + Date.now()}'></iframe>`;

		// We need the iframe to be loaded for the 'login' event to happen
		// setTimeout(() => {
		// this.innerHTML = `<div class='full full-background-image' style='background-image: url("${status.host + status.videoFeed}?${Date.now()}")'></div>`;
		// this.innerHTML = `<div class='full full-background-image' style='background-image: url("/camera/feed?${Date.now()}")'></div>`;
		// }, 2000);
	}

	setServerState(status) {
		super.setServerState(status);
		this.adapt();
	}

	connectedCallback() {
		this.adapt();
	}

	disconnectedCallback() {
		// Avoid background load
		const v = this.querySelector('video');
		if (v) {
			v.src = '';
			v.load();
		}
		this.innerHTML = '';
	}

	adapt() {
		// - this.status.code = the new status coming from the server
		// - this.statusCode = the previous status
		// - this.statusUrl = the previous url
		//
		//
		if (!this.status || !('code' in this.status)) {
			return;
		}

		if (this.status.code == TriStates.READY && this.status.url) {
			// Live event
			if (this.status.url != this.actualUrl) {
				this.actualUrl = this.status.url;
				this.innerHTML = `<video style="width: 95%; height: 95%" autoplay=1 preload="none" poster="../packages/camera/camera.png" ><source src="${this.actualUrl}"></source></video>`;
			}
		} else {
			if (this.actualUrl != '') {
				this.innerHTML = 'Camera is down';
				this.actualUrl = '';
			}
		}
	}
}
customElements.define('kiosk-camera', KioskCamera);

let lastStatus = TriStates.DOWN;

app
	.setPriority(1000)
	.setMainElement(new KioskCamera())
	.menuBasedOnIcon('../packages/camera/camera.png')
	.onServerStateChanged(() => {
		const status = app.getServerState();
		if (toastrElement) {
			toastrElement.remove();
			toastrElement = null;
		}
		app.debug('Status received', status, 'while being in', lastStatus);
		if (!status || !('code' in status)) {
			return;
		}

		if (status.code == TriStates.READY && lastStatus != TriStates.READY) {
			toastrElement = toastr.success(status.message, 'Camera', { timeOut: 15000 });
			app.setPriority(50);
		} else {
			app.setPriority(1000);
		}
		if (status.code == TriStates.UP_NOT_READY) {
			toastr.info(status.message, 'Camera', { timeOut: 0 });
		}
		if (status.code == TriStates.DOWN && lastStatus != TriStates.DOWN) {
			toastr.error(status.message, 'Camera', { timeOut: 15000 });
		}
		lastStatus = status.code;

		(/** @type {ClientAppElement} */ (app.getMainElement())).setServerState(status);
	});
