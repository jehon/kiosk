
import { ClientApp } from '../../client/client-app.js';
import ClientElement from '../../client/client-element.js';
import { priorities } from '../../client/config.js';

const app = new ClientApp('music-syno');

export class KioskMusicStatusElement extends ClientElement {
}

export class KioskMusicMainElement extends ClientElement {
}

app
	.buildMainElement(() => {

	})
	.menuBasedOnIcon('../packages/music.syno/icon.svg')
	.setPriority(priorities.music.normal)
	.setStatusElement()
	;

export default app;
