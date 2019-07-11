
import fs from 'fs';
import path from 'path';
import { spawn, exec } from 'child_process';
import { promisify } from 'util';

import serverAPIFactory, { rootDir } from '../../server/server-api.mjs';
const serverAPI = serverAPIFactory('shares');
const logger = serverAPI.logger;

const mountedList = {};

const sharesRoot = path.join(rootDir, 'media');

export async function mount(name, source, type, options = {}) {
	const target = path.join(sharesRoot, name);
	let stats = null;
	try {
		stats = await promisify(fs.stat)(target);
	} catch(e) {
		logger.trace(`Creating folder ${target}`);
		await promisify(fs.mkdir)(target);
	}
	if (stats && !stats.isDirectory()) {
		throw `Invalid name, it point to a file: ${name} to ${target}`;
	}

	// TODO: handle options
	const cmdOptions = [ '-t', type, source, target, '-o', 'username=' + options.username, '-o', 'password=' + options.password, '-o', 'domain=' + options.domain ];
	const cmdLine = 'mount "' + cmdOptions.join('" "') + '"';
	logger.trace('Mount options: ', cmdLine);

	// Handle return code and errors
	try {
		await promisify(exec)(cmdLine, {
			stdio: [ 'ignore', null, null ]
		});
		logger.trace(`Mounted ${name}`);
		return name;
	} catch (e) {
		logger.trace('Mount error returned: ', e.code, '##', e.stdout, e.stderr);

		// e.stdout:
		//  mount error(13): permission denied
		//  mount error(2): unreachable

		throw e.toString();
	}
}

// We check that we have a list
// serverAPI.addSchedule('.refresh', serverAPI.getConfig('.refresh-cron', '0 0 5 * * *'));
// serverAPI.subscribe('.refresh', (data) => generateListing(data));
// serverAPI.dispatch('.refresh');

// Register some routing functions
const app = serverAPI.getExpressApp();
app.get('/mount/mountedList', (_req, res, _next) => {
	// TODO: allow to generate from a specific folder?
	serverAPI.dispatch('.refresh', null);
	res.json(mountedList);
});

export function getMountedList() {
	return mountedList;
}

// test
