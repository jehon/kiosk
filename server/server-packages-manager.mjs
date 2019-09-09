/* eslint-env node */

import fs from 'fs';
import path from 'path';
import util from 'util';

import getConfig from './server-api-config.mjs';
import { getExpressApp } from './server-api-webserver.mjs';
import loggerAPI from '../common/logger.js';
const logger = loggerAPI('core.packages');

const root = getConfig('core.root');
const pkgRoot = path.join(root, 'packages');

async function testFolder(f) {
	return util.promisify(fs.readFile)(path.join(f, 'kiosk-manifest.json'))
		.then(data => JSON.parse(data))
		.then(data => { data.relativePath = f; return data; })
		.then(data => {
			if (data.api != '1') {
				logger.error(`Invalid api in ${data.relativePath}`);
				return false;
			}
			return data;
		})
		.catch(() => false);
}

let manifestList = null;
export let manifestListClient = null;
export let manifestListServer = null;

export async function getManifests() {
	if (!manifestList) {
		await util.promisify(fs.readdir)(pkgRoot)
			.catch(e => logger.error('Error getting the manifest list:', e))
			.then(list => list.map(el => path.join(pkgRoot, el)))
			.then(list => Promise.all(list.map(el => testFolder(el))))
			.then(list => list.filter(el => el))
			.then(list => { manifestList = list; return manifestList; });

		manifestListServer = manifestList
			.filter(el => 'server' in el)
			.map(el => path.join(el.relativePath, el.server))
		;

		manifestListClient = manifestList
			.filter(el => 'client' in el)
			.map(el => path.join('/', path.relative(root, el.relativePath), el.client))
		;


		logger.debug('Manifest list: ', manifestList);
		logger.debug('Server manifest files', manifestListServer);
		logger.debug('Client manifest files', manifestListClient);
	}
	return manifestList;
}

export async function loadServerFiles() {
	await getManifests();
	return Promise.all(
		manifestListServer.map(f => {
			logger.info('Loading', f);
			return import(f).then(
				() => logger.debug('Loading', f, 'done'),
				e => logger.error('Error loading ', f, ': ', e)
			);
		})
	);
}

// Register route on URL
const app = getExpressApp();
app.get('/core/packages/active', async (req, res) => {
	await getManifests();
	res.json(manifestListClient);
});

