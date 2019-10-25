/* eslint-env node */

const fs = require('fs');
const path = require('path');
const util = require('util');

const serverAPIFactory = require('./server-api.js');
const app = serverAPIFactory('core:server:packages');

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
let manifestListClient = null;
let manifestListServer = null;

async function getManifests() {
	if (!manifestList) {
		await util.promisify(fs.readdir)(pkgRoot)
			.then(list => list.map(el => path.join(pkgRoot, el)))
			.then(list => Promise.all(list.map(el => testFolder(el))))
			.then(list => list.filter(el => el))
			.then(list => { manifestList = list; return manifestList; })
			.catch(e => app.error('Error getting the manifest list:', e));

		if (manifestList) {
			manifestListServer = manifestList
				.filter(el => 'server' in el)
				.map(el => path.join(el.relativePath, el.server))
			;

			manifestListClient = manifestList
				.filter(el => 'client' in el)
				.map(el => path.join('/', path.relative(root, el.relativePath), el.client))
			;
		}

		app.debug('Manifest list: ', manifestList);
		app.debug('Server manifest files', manifestListServer);
		app.debug('Client manifest files', manifestListClient);
	}
	return manifestList;
}

async function loadServerFiles() {
	await getManifests();
	return Promise.all(
		manifestListServer.map(f => {
			app.debug('Loading', f);
			require(f);
			app.info('Loaded ', f);
		})
	);
}

// Register route on URL
app.getExpressApp().get('/core/packages/client/active', async (req, res) => {
	await getManifests();
	res.json(manifestListClient);
});


module.exports.manifestListClient = manifestListClient;
module.exports.manifestListServer = manifestListServer;
module.exports.getManifests = getManifests;
module.exports.loadServerFiles = loadServerFiles;
