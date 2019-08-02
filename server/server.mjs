#!/usr/bin/node --experimental-modules

// Global initialization
import { start as startServer } from './server-api-webserver.mjs';


// Self configuring internal packages
import { loadServerFiles } from './server-packages-manager.mjs';

export default async function() {
	await loadServerFiles().then(async () => {
		// Return the port
		return await startServer();
	});
}
