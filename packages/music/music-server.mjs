
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
import child_process from 'child_process';
import { onClient } from '../../server/server-lib-gui.js';

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

const MPDServerCommand = 'externals/websockify/run 8800 localhost:6600 --web externals/mpd/';

/** @type {child_process.ChildProcess} */
let socketify = null;

/**
 *
 */
function startProxy() {
	if (!socketify) {
		app.debug('Lauching mpd');

		socketify = child_process.exec(
			MPDServerCommand,
			{},
			(error, stdout, stderr) => {
				app.error(`Launching ${MPDServerCommand} gives ${error}: ${stdout} ${stderr}`);
			}
		);
		socketify.on('exit', () => {
			app.debug('MPD exited');
			socketify = null;
		});
	}
}

/**
 *
 */
function stopProxy() {
	if (socketify) {
		app.debug('Stopping mpd');
		socketify.kill();
	}
}

/**
 * Initialize the package
 *
 * @returns {module:server/ServerApp} the app
 */
export function init() {
	// New behavior
	stopProxy();

	onClient(app.getChannel(), (status => {
		if (status.active) {
			startProxy();
		} else {
			stopProxy();
		}
	}));

	// Old behavior
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
