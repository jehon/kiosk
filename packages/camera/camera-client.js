
/* global toastr */

import { ClientApp, ClientAppElement } from '../../client/client-app.js';

import { TriStates } from './constants.js';

const elevatedPriority = 1000;

// TODO: manage http errors

// TODO: handle when the app is selected, but the camera is not available
//  --> it should show an error message

const app = new ClientApp('camera');
export default app;

let toastrElement = null;

export class KioskCamera extends ClientAppElement {
	actualUrl = ''

	constructor() {
		super();

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
		if (!this.status) {
			app.debug('Adapt: no status, skipping');
			return;
		}

		if (this.status.code == TriStates.READY && this.status.url) {
			app.debug('Adapt: up', this.status, this.actualUrl);
			// Live event
			if (this.status.url != this.actualUrl) {
				app.debug('Adapt: go live');
				this.actualUrl = this.status.url;
				this.innerHTML = `<video style="width: 95%; height: 95%" autoplay=1 preload="none" poster="../packages/camera/camera.png" ><source src="${this.actualUrl}"></source></video>`;
			}
		} else {
			app.debug('Adapt: down');
			if (this.actualUrl != '') {
				app.debug('Adapt: saying it once');
				this.innerHTML = 'Camera is down: ' + JSON.stringify(this.status);
				this.actualUrl = '';
			}
			this.actualUrl = '';
		}
	}
}
customElements.define('kiosk-camera', KioskCamera);

let lastStatus = TriStates.DOWN;

app
	.setMainElement(new KioskCamera())
	.menuBasedOnIcon('../packages/camera/camera.png')
	.onServerStateChanged(() => {
		const status = app.getServerState();
		if (toastrElement) {
			toastrElement.remove();
			toastrElement = null;
		}
		app.debug('Status received', status, 'while being in', lastStatus);
		if (!status) {
			return;
		}

		if (status.code == TriStates.READY) {
			app.debug('ServerStateChanged: up, high priority');
			app.setPriority(elevatedPriority);
			if (lastStatus != TriStates.READY) {
				app.debug('ServerStateChanged: up and say it');
				toastrElement = toastr.success(status.message, 'Camera', { timeOut: 15000 });
			}
		} else {
			app.debug('ServerStateChanged: not up, low priority');
			app.setPriority();
		}
		if (status.code == TriStates.UP_NOT_READY) {
			app.debug('ServerStateChanged: warming up');
			toastrElement = toastr.info(status.message, 'Camera', { timeOut: 15000 });
		}
		if (status.code == TriStates.DOWN && lastStatus != TriStates.DOWN) {
			app.debug('ServerStateChanged: down and say it');
			toastrElement = toastr.error(status.message, 'Camera', { timeOut: 15000 });
		}
		lastStatus = status.code;

		(/** @type {ClientAppElement} */(app.getMainElement())).setServerState(status);
	});
