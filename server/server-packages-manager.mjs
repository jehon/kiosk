/* eslint-env node */

import fs from 'fs';
import path from 'path';
import util from 'util';

import getConfig from './server-api-config.mjs';
import { getExpressApp } from './server-api-webserver.mjs';
import loggerAPI from '../common/logger.js';
const logger = loggerAPI('packages-manager');

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

export async function getManifests() {
	if (!manifestList) {
		manifestList = await util.promisify(fs.readdir)(pkgRoot)
			.catch(e => logger.error('Error getting the manifest list:', e))
			.then(list => list.map(el => path.join(pkgRoot, el)))
			.then(list => Promise.all(list.map(el => testFolder(el))))
			.then(list => list.filter(el => el))
		;
	}
	return manifestList;
}

export async function getServerFiles() {
	return getManifests()
		.then(list => list.filter(el => 'server' in el))
		.then(list => list.map(el => path.join(el.relativePath, el.server)))
	;
}

export async function getClientFiles() {
	return getManifests()
		.then(list => list.filter(el => 'client' in el))
		.then(list => list.map(el => path.join('/', path.relative(root, el.relativePath), el.client)));
}

export async function loadServerFiles() {
	const list = await getServerFiles();
	return Promise.all(
		list.map(f => {
			logger.startup('Loading', f);
			return import(f).then(
				() => logger.startup('Loading', f, 'done'),
				e => logger.error('Error loading ', f, ': ', e)
			);
		})
	);
}

// Register route on URL
const app = getExpressApp();
app.get('/core/packages/active', async (req, res) => res.json(await getClientFiles()));
