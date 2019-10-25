
const fs = require('fs-extra');
const path = require('path');
const { promisify } = require('util');

const mime = require('mime-types');

const { rootDir } = require('../../server/server-api.mjs');

export function getCurrentPath(req, absolute = true) {
	const dir = decodeURI(req.originalUrl).split('?')[0];

	if (absolute) {
		return path.normalize(path.join(rootDir, dir));
	}
	return path.normalize(dir);
}

export async function getMimeType(filepath) {
	const stat = await promisify(fs.stat)(filepath);
	if (stat.isDirectory()) {
		// TODO: type of folder ? mountpoint -q -- / => exit status show if it is a mount point (0) or not (>0)
		return [ 'folder' ];
	}
	return (mime.lookup(filepath) || 'application/binary').split('/');
}

module.exports.getCurrentPath = getCurrentPath;
module.exports.getMimeType = getMimeType;
