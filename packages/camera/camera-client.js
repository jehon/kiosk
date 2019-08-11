
import AppFactory, { renderMixin } from '../../client/client-api.js';

// TODO: handle when the app is selected, but the camera is not available
//  --> it should show an error message

const app = AppFactory('camera');

let state = {
	enabled: false
};

app.subscribe('.status', data => {
	state = data;
	if (state.enabled) {
		app.withPriority(50);
	} else {
		app.withPriority(1000);
	}
});

class KioskCamera extends app.getKioskEventListenerMixin()(renderMixin(HTMLElement)) {
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
		if (state.enabled) {
			this.innerHTML = `<div class='full full-background-image' style='background-image: url("${state.liveFeedUrl}")'></div>`;
		} else {
			// TODO: icon "not available"
			this.innerHTML = '<div>Camera is not available</div>';
		}
	}
}
customElements.define('kiosk-camera', KioskCamera);

app
	.withPriority(1000)
	.withMainElement(new KioskCamera())
	.menuBasedOnIcon('/packages/camera/camera.png')
;
