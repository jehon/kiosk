
import AppFactory from '../../client/client-api.js';
const C_READY = require('electron').remote.require('./packages/camera/camera-server.js').C_READY;

// TODO: manage http errors
const C_ERROR = require('electron').remote.require('./packages/camera/camera-server.js').C_ERROR;

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
		app.debug("Skipping update, already there");
		return;
	}
	toastrLastCode = status.code;

	// Let's adapt and show status
	if (status.code == C_READY) {
		app.debug("Camera is ready, show toastr");
		app.changePriority(50);
		toastrElement = toastr.success("Ready", "Camera", { timeOut: 15000 })
	} else {
		app.changePriority(1000);
		if (status.code > 0) {
			toastrElement = toastr.info(status.message, "Camera")
		} else {
			toastr.error("Lost connection to camera");
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
				console.log("???", this._lastCode, status.code, status);
				if (this._lastCode == status.code) {
					// Idempotency
					console.log("idempotency", this._lastCode, status.code);
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
		this.innerHTML = '';
	}

	adapt() {
		if (status.code == C_READY) {

			// First load an IFrame to trigger authentication
			this.innerHTML = `<iframe style='width: 1px; height: 1px; position: absolute; left: -100px' src='${status.host + status.videoFeed + '?' + Date.now()}'></iframe>`;

			// We need the iframe to be loaded for the 'login' event to happen
			setTimeout(() => {
				this.innerHTML = `<div class='full full-background-image' style='background-image: url("${status.host + status.videoFeed}?${Date.now()}")'></div>`;
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
