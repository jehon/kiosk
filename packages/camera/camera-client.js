
import AppFactory, { renderMixin } from '../../client/client-api.js';

const app = AppFactory('camera');

let state = {
	enabled: false
};

app.subscribe('.status', data => {
	state = data;
	if (state.enabled) {
		app.enable();
	} else {
		app.disable();
	}
});

class KioskCamera extends HTMLElement {
	// Working with connected/disconnected to avoid movie running in background
	connectedCallback() {
		this.innerHTML = `<div class='full full-background-image' style='background-image: url("${state.liveFeedUrl}")'></div>`;
	}

	disconnectedCallback() {
		// Avoid background load
		this.innerHTML = '';
	}
}
customElements.define('kiosk-camera', KioskCamera);

export class KioskCameraStatus extends app.getKioskEventListenerMixin()(renderMixin(HTMLElement)) {
	get kioskEventListeners() {
		return {
			'.status': () => this.adapt()
		};
	}

	render() {
		this.innerHTML = '<img class="full"></img>';
		this.e_img = this.querySelector('img');
	}

	adapt() {
		if (state.enabled) {
			this.e_img.src = state.dataURI;
		} else {
			// TODO: icon "not available"
			this.e_img.src = '';
		}
	}
}
customElements.define('kiosk-camera-status', KioskCameraStatus);

app
	.withPriority(50)
	.withMainElement(new KioskCamera())
	.withStatusElement(new KioskCameraStatus())
	.disable()
;
