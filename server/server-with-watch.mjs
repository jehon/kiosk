#!/usr/bin/node --experimental-modules

import hotReloadingProxy from '../node_modules/hot-reloading-proxy/server.js';
import opn from '../node_modules/opn/index.js';

import serverAPIFactory from './server-api.mjs';
const serverAPI = serverAPIFactory('server-with-watch');

import { startServer } from './server.mjs';

hotReloadingProxy.start({
	port: 3000,
	remote: 'http://localhost:3001'
});
startServer(3001, true);

serverAPI.logger.startup('Live server is at http://localhost:3001');
serverAPI.logger.startup('Hot server is at http://localhost:3000');
opn('http://localhost:3000');
