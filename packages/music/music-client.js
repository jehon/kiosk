
import ClientAppElement from '../../client/client-app-element.js';
import { ClientApp, iFrameBuilder } from '../../client/client-app.js';

const app = new ClientApp('music');

export class KioskMusicClient extends ClientAppElement {
	constructor() {
		super(app);

		this.attachShadow({ mode: 'open' });
		this.shadowRoot.innerHTML = `
			music
		`;
		this.shadowRoot.insertAdjacentElement('afterbegin', new iFrameBuilder('http://192.168.1.9:4001'));
	}
}

customElements.define('kiosk-music', KioskMusicClient);

app
	.setMainElementBuilder(() => new KioskMusicClient())
	.menuBasedOnIcon('../packages/music/icon.svg')
	// .setPriority(10000) // Temp
	;

export default app;
