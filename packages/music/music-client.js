
// https://www.electronjs.org/docs/latest/api/browser-view
// https://www.npmjs.com/package/syno
// https://global.download.synology.com/download/Document/Software/DeveloperGuide/Os/DSM/All/enu/DSM_Login_Web_API_Guide_enu.pdf
// https://www.nas-forum.com/forum/topic/46256-script-web-api-synology/
// https://global.download.synology.com/download/Document/Software/DeveloperGuide/Package/AudioStation/All/enu/AS_Guide.pdf

// https://myds.com:port/webapi/entry.cgi?api=SYNO.API.Auth&version=6&method=login&account=<USERNAME>&passwd=<PASSWORD></PASSWORD>

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
