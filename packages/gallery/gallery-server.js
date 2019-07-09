
import fs from 'fs-extra';
import path from 'path';
import { promisify } from 'util';

import { getCurrentPath, getMimeType } from './gallery-lib.js';

import serverAPIFactory, { rootDir } from '../../server/server-api.mjs';
const serverAPI = serverAPIFactory('gallery');

const app = serverAPI.getExpressApp();

export async function describeFile(filePath, infos = null) {
	let absolutePath = '';
	if (filePath[0] == '/') {
		absolutePath = filePath;
	} else {
		// Relative file
		absolutePath = path.join(rootDir, filePath);
	}
	const url = path.relative(rootDir, absolutePath);

	const mimeTypes = await getMimeType(absolutePath);
	const desc = {
		name: path.basename(absolutePath),
		type: mimeTypes[0],
		mimeType: mimeTypes.join('/'),
		url,
		infos
		// TODO in photo-frame: call this describeFile
	};
	return desc;
}

// Directory listing: get the json
// We expect the path to be relative to the root of the repository
app.use('*/', async (req, res, next) => {
	let currentPath = getCurrentPath(req);
	try {
		const stat = await promisify(fs.stat)(currentPath);
		if (!stat.isDirectory(currentPath)) {
			return next();
		}
	} catch(e)  {
		return next();
	}
	try {
		let data = {
			currentPath: currentPath,
			files: []
		};
		const fileslist = await promisify(fs.readdir)(currentPath);
		await Promise.all(
			fileslist
				.filter(file => !(file in [ '.', '..', '@eaDir', '.picasa.ini', 'Thumbs.db' ]))
				.map(async file => data.files.push(await describeFile(path.join(currentPath, file))))
		);
		return res.json(data);
	} catch(error) {
		if (error.code === 'ENOENT') {
			next();
		}
		error.status = error.code === 'ENAMETOOLONG' ? 414 : 500;
		return next(error);
	}
});
