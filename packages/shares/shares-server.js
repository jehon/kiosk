
const fs = require('fs');
const path = require('path');
const { exec } = require('child_process');
const { promisify } = require('util');

const serverAPIFactory = require('../../server/server-api.js');
const app = serverAPIFactory('shares');
const rootDir = app.getConfig('server.root');

const mountedList = {};

const sharesRoot = path.join(rootDir, 'media');

/**
 * @param name
 * @param mountPoint
 */
async function mount(name, mountPoint) {
	app.info(`Mounting ${name} with ${mountPoint}`);
	const target = path.join(sharesRoot, name);
	let stats = null;
	try {
		stats = await promisify(fs.stat)(target);
	} catch(e) {
		app.debug(`Creating folder ${target}`);
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
	app.debug('Mount options: ', cmdLine);

	// Handle return code and errors
	try {
		await promisify(exec)(cmdLine, {
			stdio: [ 'ignore', null, null ]
		});
		app.debug(`Mounted ${name}`);
		mount[name] = mountPoint;
		// TODO
		// app.dispatch('.mounted.' + name);
		// app.dispatch('.mounted.list', getMountedList());

		return name;
	} catch (e) {
		app.debug('Mount error returned: ', e.code, '##', e.stdout, e.stderr);

		// e.stdout:
		//  mount error(13): permission denied
		//  mount error(2): unreachable

		throw e.toString();
	}
}
module.exports.mount = mount;

/**
 *
 */
function getMountedList() {
	return mountedList;
}
module.exports.getMountedList = getMountedList;

// const shares = serverAPI.getConfig('shares', {});
// Object.keys(shares).forEach(k => {
// 	mount(k, shares[k]);
// });

/*
//192.168.1.9/photo             /opt/web/www/media/photo        cifs    vers=1.0,auto,user,noexec,nosuid,ro,credentials=/root/synology.credent$
*/
