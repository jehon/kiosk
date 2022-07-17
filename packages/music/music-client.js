
import { ClientApp, iFrameBuilder } from '../../client/client-app.js';
import { priorities } from '../../client/config.js';

const app = new ClientApp('music');

app
	.setMainElementBuilder(() => iFrameBuilder('http://' + location.hostname + ':8800/'))
	.menuBasedOnIcon('../packages/music/icon.svg')
	.setPriority(priorities.music.normal)
	;

export default app;
