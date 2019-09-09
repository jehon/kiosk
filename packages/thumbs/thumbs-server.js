
import { getCurrentPath, getMimeType } from './lib.js';

import sharp from 'sharp';
import promiseLimit from 'promise-limit';

import { priorityMiddleware } from '../../server/server-api-webserver.mjs';
import serverAPIFactory from '../../server/server-api.mjs';
const app = serverAPIFactory('thumbs');

// Config
const defaultHeight = app.getConfig('.default.height'); // TODO: make the default value a parameter

// Redirect to thumbs
const generatorLimiter = promiseLimit(3);
priorityMiddleware.use(async (req, res, next) => {
	if (!('thumb' in req.query)) {
		return next();
	}
	let file = getCurrentPath(req);
	app.debug('thumb route for ' + file);
	let mimeTypeArray = '';
	try {
		mimeTypeArray = await getMimeType(file);
	} catch (e) {
		app.error('Could not get the mime type of the file', file, e);
		res.set('X-Thumb', 'Invalid file: no mime-type found');
		return next();
	}
	if (mimeTypeArray[0] != 'image') {
		app.debug('File is not an image', file);
		res.set('X-Thumb', 'Invalid thumb: not an image');
		return next();
	}
	// We have an image...
	if (mimeTypeArray[1] == 'svg+xml') {
		app.debug('svg are not handled, tehy are naturally scallable');
		res.set('X-Thumb', 'svg');
		// SVG does not need to be managed, they are small anyway
		return next();
	}

	let height = null;
	let width = null;
	if ('width' in req.query) {
		width = parseInt(req.query.width, 10);
		if (isNaN(width) || width <= 0) {
			app.error('Invalid thumb width: ', width);
			return next('Invalid thumb width');
		}
	}
	if ('height' in req.query) {
		height = parseInt(req.query.height, 10);
		if (isNaN(height) || height <= 0) {
			app.error('Invalid thumb height: ', height);
			return next('Invalid thumb height');
		}
	}
	if (!height && !width) {
		// default value
		height = defaultHeight;
		app.debug('No height or width, setting default height to ', height);
	}

	res.set('Cache-Control', 'public, max-age=' + 24 * 60 * 60 * 1000);
	res.set('X-Thumb', `generated for file ${file} at size ${height}x${width}`);

	app.debug('Generating the real thumb');

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
