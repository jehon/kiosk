
import ClientAppElement from '../../client/client-app-element.js';
import { ClientApp } from '../../client/client-app.js';
import { priorities } from '../../client/config.js';

import { TriStates } from './constants.js';

const app = new ClientApp('camera', {
	code: TriStates.DOWN
});

// TODO: manage http errors

// TODO: handle when the app is selected, but the camera is not available
//  --> it should show an error message

export class KioskCamera extends ClientAppElement {
	actualUrl = ''

	constructor() {
		super(app);
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

	disconnectedCallback() {
		super.disconnectedCallback();

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

export class KioskCameraStatus extends ClientAppElement {
	constructor() {
		super(app);
		this.innerHTML = '<img src="../packages/camera/camera.png" />';
		this.setServerState({ code: TriStates.DOWN });
	}

	setServerState(status) {
		super.setServerState(status);
		switch (status.code) {
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
customElements.define('kiosk-camera-status', KioskCameraStatus);

app
	.setMainElementBuilder(() => new KioskCamera())
	.menuBasedOnIcon('../packages/camera/camera.png')
	.setStatusElement(new KioskCameraStatus());
app
	.onServerStateChanged((status, app) => {
		app.debug('Status received', status);
		if (!status) {
			return;
		}
		switch (status.code) {
			case TriStates.READY:
				app.debug('ServerStateChanged: up, high priority', status.message);
				app.setPriority(priorities.camera.elevated);
				break;
			case TriStates.UP_NOT_READY:
				app.debug('ServerStateChanged: warming up', status.message);
				app.setPriority(priorities.camera.normal);
				break;
			case TriStates.DOWN:
				app.debug('ServerStateChanged: down', status.message);
				app.setPriority(priorities.camera.normal);
				break;
		}
	});
export default app;

