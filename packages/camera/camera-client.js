
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
			// TODO: add sound
			//this.innerHTML = `<div class='full full-background-image' style='background-image: url("${status.host + status.videoFeed}?${Date.now()}")'></div>`;
			this.innerHTML = `<iframe class='full' src='${status.host + status.videoFeed + '?' + Date.now()}'></iframe>`;
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
