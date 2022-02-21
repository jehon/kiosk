
import { ClientApp, iFrameBuilder } from '../../client/client-app.js';
import { priorities } from '../../client/config.js';

const app = new ClientApp('music');

app
	.setMainElementBuilder(() => iFrameBuilder('../externals/mpd/index.html'))
	.menuBasedOnIcon('../packages/music/icon.svg')
	.setPriority(priorities.music.normal)
	;

export default app;
