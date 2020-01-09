
const fs = require('fs');
const path = require('path');
const util = require('util');

const app = require( './server-api.js')('core:server:packages');

const root = app.getConfig('core.root');
const pkgRoot = path.join(root, 'packages');
app.debug('Packages should be located in ' + pkgRoot);

async function testFolder(f) {
	return util.promisify(fs.readFile)(path.join(f, 'kiosk-manifest.json'))
		.then(data => {
			app.debug('Found package with kiosk-manifest.json at ' + data.relativePath);
			return data;
		})
		.then(data => JSON.parse(data))
		.then(data => { data.relativePath = f; return data; })
		.then(data => {
			if (data.api != '1') {
				app.error(`Invalid api ${data.api} in ${data.relativePath}`);
				return false;
			}
			return data;
		})
		.catch(() => false);
}

let manifestList = null;
module.exports.manifestListClient = null;
module.exports.manifestListServer = null;

async function getManifests() {
	if (!manifestList) {
		await util.promisify(fs.readdir)(pkgRoot)
			.then(list => list.map(el => path.join(pkgRoot, el)))
			.then(list => Promise.all(list.map(el => testFolder(el))))
			.then(list => list.filter(el => el))
			.then(list => { manifestList = list; return manifestList; })
			.catch(e => app.error('Error getting the manifest list:', e));

		if (manifestList) {
			module.exports.manifestListServer = manifestList
				.filter(el => 'server' in el)
				.map(el => path.join(el.relativePath, el.server))
			;

			module.exports.manifestListClient = manifestList
				.filter(el => 'client' in el)
				.map(el => '../' + path.join(path.relative(root, el.relativePath), el.client))
			;
		}

		app.debug('Manifest list: ', manifestList);
		app.debug('Server manifest files', module.exports.manifestListServer);
		app.debug('Client manifest files', module.exports.manifestListClient);
	}
	return manifestList;
}
module.exports.getManifests = getManifests;

module.exports.loadServerFiles = async function() {
	await getManifests();
	return Promise.all(
		module.exports.manifestListServer.map(f => {
			app.debug('Loading', f);
			try {
				require(f);
				app.info('Loaded', f);
			} catch(e) {
				app.error('Error loading ', f, ': ', e);
			}
		})
	);
};

module.exports.getClientFiles = async function() {
	return getManifests()
		.then(() => module.exports.manifestListClient);
};
