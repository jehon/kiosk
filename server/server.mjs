#!/usr/bin/node --experimental-modules

// Global initialization
import { start } from './server-api-webserver.mjs';


// Self configuring internal packages
import { loadServerFiles } from './server-packages-manager.mjs';

export default async function() {
	await loadServerFiles().then(() => {
		start();
	});
}
