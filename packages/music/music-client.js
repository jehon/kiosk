
import { ClientApp } from '../../client/client-app.js';
import ClientElement from '../../client/client-element.js';
import { selectApplication } from '../../client/client-lib-chooser.js';
import { sendToServer } from '../../client/client-server.js';
import { priorities } from '../../client/config.js';
import { MUSIC_CHANNEL } from './music-common.mjs';

const app = new ClientApp('music');

let currentFolder = '/';
let playlist = [];

export class KioskMusicStatusElement extends ClientElement {
	#img;

	constructor() {
		super();
		this.shadowRoot.innerHTML = `
			<img width="100%" src="../packages/music/icon.svg">
		`;

		this.shadowRoot.querySelector('img').addEventListener('click', () => {
			selectApplication(app);
		});
	}

	stateChanged(status) {
		this.toggleAttribute('disabled', !status || !status.server || !status.server.playing);
	}
}
customElements.define('kiosk-music-status-element', KioskMusicStatusElement);

export class KioskMusicMainElement extends ClientElement {
	#currentFolder = '';
	#renderedFolder = '';

	connectedCallback() {
		this.shadowRoot.innerHTML = `
		music player ${currentFolder}
			<pre>
				${JSON.stringify(playlist, null, 2)}
			</pre>
		`;
		this.setFolder(currentFolder);
	}

	setFolder(folder) {
		if (folder == this.#currentFolder) {
			return;
		}

		this.#currentFolder = folder;
		sendToServer(MUSIC_CHANNEL, this.#currentFolder);
	}

	// stateChanged() {
	// 	if (this.getState().currentFolder != this.#renderedFolder) {

	// 	}
	// }
}
customElements.define('kiosk-music-main-element', KioskMusicMainElement);

app
	// .setState({ currentFolder: '/' })
	.setMainElementBuilder(() => new KioskMusicMainElement())
	.menuBasedOnIcon('../packages/music.syno/icon.svg')
	.setPriority(priorities.music.normal)
	.setStatusElement(new KioskMusicStatusElement())
	.onStateChange((status, _app) => {
		playlist = status.folderContent;
		currentFolder = status.currentFolder;
	})
	;

export default app;
