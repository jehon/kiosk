
// https://www.npmjs.com/package/syno
// https://global.download.synology.com/download/Document/Software/DeveloperGuide/Os/DSM/All/enu/DSM_Login_Web_API_Guide_enu.pdf
// https://www.nas-forum.com/forum/topic/46256-script-web-api-synology/
// https://global.download.synology.com/download/Document/Software/DeveloperGuide/Package/AudioStation/All/enu/AS_Guide.pdf

// https://myds.com:port/webapi/entry.cgi?api=SYNO.API.Auth&version=6&method=login&account=<USERNAME>&passwd=<PASSWORD></PASSWORD>

import path from 'path';
import { fileURLToPath } from 'url';

import { readFileSync } from 'original-fs';
import serverAppFactory from '../../server/server-app.js';
import hookWebview from '../../server/server-app-webview.js';

/**
 * @type {module:server/ServerApp}
 */
const app = serverAppFactory('music-syno');

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
	const script = readFileSync(path.join(path.dirname(fileURLToPath(import.meta.url)), 'music-inject.js'));
	hookWebview(
		app,
		`${server}/?launchApp=SYNO.SDS.AudioStation.Application`,
		`${script}; doLogin("${username}", "${password}");`
	);

	app.setState(status);

	return app;
}

init();
