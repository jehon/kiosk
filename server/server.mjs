#!/usr/bin/node --experimental-modules

// Global initialization
import { start as startServer } from './server-api-webserver.mjs';
import './server-client-logger.mjs';

// Self configuring internal packages
import { loadServerFiles } from './server-packages-manager.mjs';

export default async (port) => loadServerFiles()
	.then(() => startServer(port));
