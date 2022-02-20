
import { ClientApp } from '../../client/client-app.js';
import { priorities } from '../../client/config.js';
import ClientElement from '../../client/client-element.js';

const app = new ClientApp('music');

export class KioskMusicElement extends ClientElement {
	ready() {
		this.shadowRoot.innerHTML = `
		musique!
			<iframe 
				src='http://localhost:8800'
				width='100%'
				height='100%'
			></iframe>
		`;
	}
}
customElements.define('kiosk-music-element', KioskMusicElement);

app
	.setMainElementBuilder(() => new KioskMusicElement())
	.menuBasedOnIcon('../packages/music/icon.svg')
	.setPriority(priorities.music.normal)
	;

export default app;
