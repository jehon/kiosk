
import ClientAppElement from '../../client/client-app-element.js';
import { ClientApp } from '../../client/client-app.js';

const app = new ClientApp('music');

export class KioskMusic extends ClientAppElement {
	constructor() {
		super(app);
		this.innerHTML = `
			music
		`;
	}

	setServerState(status) {
		super.setServerState(status);
		this.adapt();
	}

	adapt() {
	}

	connectedCallback() {
	}
}

customElements.define('kiosk-music', KioskMusic);

app
	.setMainElementBuilder(() => new KioskMusic())
	.menuBasedOnIcon('../packages/music/icon.svg');

export default app;
