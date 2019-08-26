
import { getCurrentPath, getMimeType } from './lib.js';

import sharp from 'sharp';
import promiseLimit from 'promise-limit';

import { priorityMiddleware } from '../../server/server-api-webserver.mjs';
import serverAPIFactory from '../../server/server-api.mjs';
const serverAPI = serverAPIFactory('thumbs');

// Config
const defaultHeight = serverAPI.getConfig('.default.height'); // TODO: make the default value a parameter

// Redirect to thumbs
const generatorLimiter = promiseLimit(3);
priorityMiddleware.use(async (req, res, next) => {
	if (!('thumb' in req.query)) {
		return next();
	}
	let file = getCurrentPath(req);
	serverAPI.logger.trace('thumb route for ' + file);
	let mimeTypeArray = '';
	try {
		mimeTypeArray = await getMimeType(file);
	} catch (e) {
		serverAPI.logger.trace(`Could not get the mime type of the file: ${file}`, e);
		return next();
	}
	if (mimeTypeArray[0] != 'image') {
		res.set('X-Thumb', 'Invalid thumb: not an image');
		return next();
	}
	// We have an image...
	if (mimeTypeArray[1] == 'svg+xml') {
		res.set('X-Thumb', 'svg');
		// SVG does not need to be managed, they are small anyway
		return next();
	}

	let height = null;
	let width = null;
	if ('width' in req.query) {
		width = parseInt(req.query.width, 10);
		if (isNaN(width) || width <= 0) {
			return next('Invalid thumb width');
		}
	}
	if ('height' in req.query) {
		height = parseInt(req.query.height, 10);
		if (isNaN(height) || height <= 0) {
			return next('Invalid thumb height');
		}
	}
	if (!height && !width) {
		// default value
		height = defaultHeight;
		serverAPI.logger.trace('No height or width, setting default height to ', height);
	}

	res.set('Cache-Control', 'public, max-age=' + 24 * 60 * 60 * 1000);
	res.set('X-Thumb', `generated for file ${file} at size ${height}x${width}`);

	// Create the thumbnail
	return generatorLimiter(
		async function() {
			// http://sharp.pixelplumbing.com/en/stable/api-resize/
			await sharp(file)
				.resize({
					width, height,
					kernel: sharp.kernel.nearest
				})
				.pipe(res);
		}
	);
});
