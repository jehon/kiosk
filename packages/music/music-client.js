
import ClientAppElement from '../../client/client-app-element.js';
import { ClientApp } from '../../client/client-app.js';
import { sendToServer } from '../../client/client-server.js';
import { priorities } from '../../client/config.js';

const app = new ClientApp('music');

export class KioskMusicClient extends ClientAppElement {
	#top;

	constructor() {
		super(app);

		this.attachShadow({ mode: 'open' });
		this.shadowRoot.innerHTML = `
			<div id='top'></div>
		`;
		this.#top = this.shadowRoot.querySelector('#top');
	}

	connectedCallback() {
		super.connectedCallback();
		sendToServer('music', { active: true });
		this.#top.innerHTML = 'Loading';

		// When active, it remain active for all the time needed...
		app.setPriority(priorities.music.elevated);
	}

	disconnectedCallback() {
		super.disconnectedCallback();
		sendToServer('music', { active: false });
		this.#top.innerHTML = 'Disconnected';
		app.setPriority(priorities.music.normal);
	}
}

customElements.define('kiosk-music', KioskMusicClient);

app
	.setMainElementBuilder(() => new KioskMusicClient())
	.menuBasedOnIcon('../packages/music/icon.svg')
	.setPriority(priorities.music.normal)
	;

export default app;
