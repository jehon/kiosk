
import AppFactory from '../../client/client-api.js';

// TODO: handle when the app is selected, but the camera is not available
//  --> it should show an error message

const app = AppFactory('camera');

let status = {
	enabled: false
};

app.subscribe('.status', () => {
	status = { ...require('electron').remote.require('./packages/camera/camera-server.js').getStatus() };
	if (status.enabled) {
		app.changePriority(50);
	} else {
		app.changePriority(1000);
	}
});

app.dispatch('.status');

class KioskCamera extends app.getKioskEventListenerMixin()(HTMLElement) {
	// Working with connected/disconnected to avoid movie running in background
	get kioskEventListeners() {
		return {
			'.status': () => this.adapt()
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
		if (status.enabled) {

			// this.innerHTML = `<img src="${status.host + status.videoFeed}?${Date.now()}"/>`;

			this.innerHTML = `<iframe style='width: 1px; height: 1px; position: absolute; left: -100px' src='${status.host + status.videoFeed + '?' + Date.now()}'></iframe>`;

			// We need the iframe to be loaded for the 'login' event to happen
			setTimeout(() => {
				this.innerHTML = `<div class='full full-background-image' style='background-image: url("${status.host + status.videoFeed}?${Date.now()}")'></div>`;
			}, 2000);

			// TODO: add sound

		} else {
			// TODO: icon "not available"
			this.innerHTML = `<div>Camera is not available: ${status.errMessage}</div>`;
		}
	}
}
customElements.define('kiosk-camera', KioskCamera);

app
	.withPriority(1000)
	.withMainElement(new KioskCamera())
	.menuBasedOnIcon('../packages/camera/camera.png')
;
