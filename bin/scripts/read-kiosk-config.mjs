#!/usr/bin/node --experimental-modules

import getConfig  from '../../server/server-config.mjs';

let args = getConfig('_');
if (args.length < 2) {
	// eslint-disable-next-line no-console
	console.error('Must specify: <key> <default_value>');
}

let key = getConfig('_.0');
let def = getConfig('_.1');

// eslint-disable-next-line no-console
console.info(getConfig(key, def));
