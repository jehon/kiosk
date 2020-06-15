
/* global toastr */

import AppFactory from '../../client/client-api.js';
const TriStates = require('electron').remote.require('./packages/camera/constants.js').TriStates;

// TODO: manage http errors

// TODO: handle when the app is selected, but the camera is not available
//  --> it should show an error message

const app = AppFactory('camera');

let status = {
	code: 0
};

let toastrElement = false;
let toastrLastCode = 0;

app.subscribe('.status', () => {
	if (toastrElement) {
		toastrElement.remove();
		// toastr.remove(toastrElement);
		toastrElement = false;
	}
	status = { ...require('electron').remote.require('./packages/camera/camera-server.js').getStatus() };
	app.debug('Status received', status, 'while being in', toastrLastCode);

	if (toastrLastCode == status.code) {
		app.debug('Skipping update, already there');
		return;
	}
	toastrLastCode = status.code;

	// Let's adapt and show status
	if (status.code == TriStates.READY) {
		app.debug('Camera is ready, show toastr');
		app.changePriority(50);
		toastrElement = toastr.success('Ready', 'Camera', { timeOut: 15000 });
	} else {
		app.changePriority(1000);
		if (status.code > 0) {
			toastrElement = toastr.info(status.message, 'Camera', { timeOut: 0 });
		} else {
			toastr.error('Lost connection to camera', 'Camera', { timeOut: 15000 });
		}
	}
});

// TODO: core.ready?
setTimeout(() => app.dispatch('.status'), 5000);

class KioskCamera extends app.getKioskEventListenerMixin()(HTMLElement) {
	// Working with connected/disconnected to avoid movie running in background
	get kioskEventListeners() {
		return {
			'.status': () => {
				if (this._lastCode == status.code) {
					// Idempotency
					return;
				}
				this.adapt();
			}
		};
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
		if (status.code == TriStates.READY) {
			this.innerHTML = '<video style="width: 100%; height: 100%" autoplay=1 preload="none" poster="../packages/camera/camera.png" ><source src="/camera/feed"></video>';

			// First load an IFrame to trigger authentication
			// this.innerHTML = `<iframe style='width: 1px; height: 1px; position: absolute; left: -100px' src='${status.host + status.videoFeed + '?' + Date.now()}'></iframe>`;

			// We need the iframe to be loaded for the 'login' event to happen
			setTimeout(() => {
				// this.innerHTML = `<div class='full full-background-image' style='background-image: url("${status.host + status.videoFeed}?${Date.now()}")'></div>`;
				// this.innerHTML = `<div class='full full-background-image' style='background-image: url("/camera/feed?${Date.now()}")'></div>`;
			}, 2000);

			// TODO: add sound

		} else {
			// TODO: icon "not available"
			this.innerHTML = `<div>Camera is not available: #${status.code}: ${status.message}</div>`;
		}
		this._lastCode = status.code;
	}
}
customElements.define('kiosk-camera', KioskCamera);

app
	.withPriority(1000)
	.withMainElement(new KioskCamera())
	.menuBasedOnIcon('../packages/camera/camera.png')
;
