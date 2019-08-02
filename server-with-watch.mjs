#!/usr/bin/node --experimental-modules

import hotReloadingProxy from 'hot-reloading-proxy/server.js';

import startServer from './server/server.mjs';
import * as browser from './server/browser.js';

import serverAPIFactory from './server/server-api.mjs';
const serverAPI = serverAPIFactory('server-with-watch');

hotReloadingProxy.start({
	port: 3000,
	remote: 'http://localhost:3001'
});
startServer(3001, true);

serverAPI.logger.startup('Live server is at http://localhost:3001');
serverAPI.logger.startup('Hot server is at http://localhost:3000');
browser.start(3000, false);
