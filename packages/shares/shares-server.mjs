
import fs from 'fs';
import path from 'path';
import { exec } from 'child_process';
import { promisify } from 'util';

import serverAPIFactory, { rootDir } from '../../server/server-api.mjs';
const serverAPI = serverAPIFactory('shares');
const logger = serverAPI.logger;

const mountedList = {};

const sharesRoot = path.join(rootDir, 'media');

export async function mount(name, mountPoint) {
	logger.info(`Mounting ${name} with ${mountPoint}`);
	const target = path.join(sharesRoot, name);
	let stats = null;
	try {
		stats = await promisify(fs.stat)(target);
	} catch(e) {
		logger.debug(`Creating folder ${target}`);
		await promisify(fs.mkdir)(target);
	}
	if (stats && !stats.isDirectory()) {
		throw `Invalid name, it point to a file: ${name} to ${target}`;
	}

	// TODO: handle options
	const cmdOptions = [ '-t', mountPoint.type, mountPoint.source, target,
		'-o', 'username=' + mountPoint.username,
		'-o', 'password=' + mountPoint.password,
		'-o', 'domain=' + mountPoint.domain ];
	const cmdLine = 'mount "' + cmdOptions.join('" "') + '"';
	logger.debug('Mount options: ', cmdLine);

	// Handle return code and errors
	try {
		await promisify(exec)(cmdLine, {
			stdio: [ 'ignore', null, null ]
		});
		logger.debug(`Mounted ${name}`);
		mount[name] = mountPoint;
		serverAPI.dispatch('.mounted.' + name);
		serverAPI.dispatch('.mounted.list', getMountedList());

		return name;
	} catch (e) {
		logger.debug('Mount error returned: ', e.code, '##', e.stdout, e.stderr);

		// e.stdout:
		//  mount error(13): permission denied
		//  mount error(2): unreachable

		throw e.toString();
	}
}

export function getMountedList() {
	return mountedList;
}

// Register some routing functions
const app = serverAPI.getExpressApp();
app.get('/mount/mountedList', (_req, res, _next) => {
	// TODO: allow to generate from a specific folder?
	serverAPI.dispatch('.refresh', null);
	res.json(mountedList);
});

// const shares = serverAPI.getConfig('shares', {});
// Object.keys(shares).forEach(k => {
// 	mount(k, shares[k]);
// });

/*
//192.168.1.9/photo             /opt/web/www/media/photo        cifs    vers=1.0,auto,user,noexec,nosuid,ro,credentials=/root/synology.credent$
*/
