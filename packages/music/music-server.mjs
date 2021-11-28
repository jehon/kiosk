
// https://www.npmjs.com/package/syno
// https://global.download.synology.com/download/Document/Software/DeveloperGuide/Os/DSM/All/enu/DSM_Login_Web_API_Guide_enu.pdf
// https://www.nas-forum.com/forum/topic/46256-script-web-api-synology/
// https://global.download.synology.com/download/Document/Software/DeveloperGuide/Package/AudioStation/All/enu/AS_Guide.pdf

// https://myds.com:port/webapi/entry.cgi?api=SYNO.API.Auth&version=6&method=login&account=<USERNAME>&passwd=<PASSWORD></PASSWORD>

import path from 'path';
import { fileURLToPath } from 'url';

import { readFileSync } from 'original-fs';
import serverAppFactory from '../../server/server-app.js';
import { createClientView, onClient } from '../../server/server-lib-gui.js';

/**
 * @type {module:server/ServerApp}
 */
const app = serverAppFactory('music');

export default app;

const status = {
	config: app.getConfig(),
};

const server = app.getConfig('credentials.synology.url');
const username = app.getConfig('credentials.synology.username');
const password = app.getConfig('credentials.synology.password');

/**
 * Initialize the package
 *
 * @returns {module:server/ServerApp} the app
 */
export function init() {
	app.debug('Programming music backend');

	let webContent;
	let lastActive = null;

	onClient('music', (status => {
		if (status.active === lastActive) {
			return;
		}
		lastActive = status.active;
		if (status.active) {
			app.debug('Launching webView');
			createClientView(`${server}/?launchApp=SYNO.SDS.AudioStation.Application`)
				.then(wc => {
					webContent = wc;
					const script = readFileSync(path.join(path.dirname(fileURLToPath(import.meta.url)), 'music-inject.js'));

					wc.executeJavaScript(`
					${script};

					doLogin("${username}", "${password}")
				`);
				});

		} else {
			app.debug('Stoping webview');
			if (webContent) {
				webContent.destroy();
				webContent = null;
			}
		}
	}));

	app.setState(status);

	return app;
}

init();
