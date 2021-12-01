
import KioskClientElementWebView from '../../client/client-app-element-webview.js';
import { ClientApp } from '../../client/client-app.js';
import { priorities } from '../../client/config.js';

const app = new ClientApp('music');

app
	.setMainElementBuilder(() =>
		(new KioskClientElementWebView(app))
			.withElevatedPriority(priorities.music.elevated)
	)
	.menuBasedOnIcon('../packages/music/icon.svg')
	.setPriority(priorities.music.normal)
	;

export default app;
