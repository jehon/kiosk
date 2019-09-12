#!/usr/bin/node --experimental-modules

// Global initialization
import { start as startServer } from './server-webserver.mjs';
import './server-client-logger.mjs';

// Self configuring internal packages
import { loadServerFiles } from './server-packages-manager.mjs';

import serverAPIFactory from './server-api.mjs';
const app = serverAPIFactory('core:server');

export default async (port) => loadServerFiles()
	.then(() => startServer(port))
	.then(() => {
		app.dispatchToBrowser('core.started', {
			startupTime: new Date()
		});
	});
