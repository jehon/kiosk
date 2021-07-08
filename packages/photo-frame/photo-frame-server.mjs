
import serverAppFactory from '../../server/server-app.js';

import fs from 'fs';
import mime from 'mime-types';
import shuffleArray from 'shuffle-array';
import path from 'path';
import minimatch from 'minimatch';
import exifParser from './exif-parser.mjs';

/**
 * @typedef FolderConfig
 * @param {string} name - name of the config
 * @param {string} folder relative or absolute
 * @param {number} quantity of files
 * @param {string} mimeTypePattern to be matched
 * @param {Array<string>} excludes to be excluded (using minimatch)
 *
 *  folder: /media/photo/
 *	quantity: 20
 *	excludes:
 *	  - "#recycle"
 *	  - "0 A trier"
 */

/**
 * @typedef ImageData
 * @param {string} subPath relative to the folderConfig home
 * @param {string} path is subPath concatenated with folderConfig path
 * @param {string} url the url of the file (unused ?)
 * @param {FolderConfig} folderConfig where the file has been defined
 * @param {string} data.comment from exiv
 * @param {string} data.date from exiv
 * @param {number} data.orientation from exiv
 *
 * {
 *   subPath: 'f1/i1.png',
 *   path: 'tests/server/data/photo-frame/f1/i1.png',
 *   data: {
 *	   comment: 'Test comment here',
 *	   date: '2019-07-01 02:03:04',
 *	   orientation: 0
 * }
 */

/**
 * @type {module:server/ServerApp}
 */
const app = serverAppFactory('photo-frame');

export default app;

// See https://nodejs.org/dist/latest-v12.x/docs/api/modules.html#modules_module_createrequire_filename
import pLimitFactory from 'p-limit';

const buildingLogger = app.extend('building');

/**
 * Test if a file match the pattern
 * (used to exclude files)
 *
 * @param {string} filename to be matched
 * @param {string} pattern to match
 * @returns {boolean} true if it match
 */
function matchFile(filename, pattern) {
	return minimatch(filename, pattern, {
		nocase: true,
		nocomment: true,
		nonegate: true
	});
}

/**
 * Get all files of a folder
 *
 * @param {string} folder relative to cwd or absolute
 * @param {Array<string>} excludes to be excluded (by minimatch *.*, ...)
 * @returns {Array<string>} of file paths relative to folderConfig.folder
 */
export async function _getFilesFromFolder(folder, excludes = []) {
	return fs.readdirSync(folder)
		.filter(file => !(file in ['.', '..']))
		.filter(file => excludes.reduce((acc, val) => acc && !matchFile(file, val), true));
}

/**
 * Get files of mimetype in a folder
 *
 * @param {string} folder relative to cwd or absolute
 * @param {Array<string>} excludes to be excluded (by minimatch *.*, ...)
 * @param {string} mimeTypePattern to filter in (image/*)
 * @returns {Array<string>} of file paths relative to folderConfig.folder
 */
export async function _getFilesFromFolderByMime(folder, excludes, mimeTypePattern) {
	return (await _getFilesFromFolder(folder, excludes))
		.filter(f => {
			let mt = mime.lookup(path.join(folder, f));
			if (typeof (mt) != 'string') {
				return false;
			}
			return mt.match(mimeTypePattern);
		});
}

/**
 * Get subfolders out of a folder
 *
 * @param {string} folder relative to cwd or absolute
 * @param {Array<string>} excludes to be excluded (by minimatch *.*, ...)
 * @returns {Array<string>} of folders (absolute)
 */
export async function _getFoldersFromFolder(folder, excludes) {
	return (await _getFilesFromFolder(folder, excludes))
		.filter(f => fs.statSync(path.join(folder, f)).isDirectory());
}

/**
 * Find "n" files in the folders and build up a list
 * It will recurse to subfolders (up and down) until "n" files are found
 *
 * @param {FolderConfig} folderConfig where to search for
 * @param {number} n of files to take (will be updated with really taken count)
 * @param {string} subpath where to look for
 * @param {Array<string>} previouslySelected is the list of previously visited folder (relative to folderConfig)
 * @returns {Array<string>} is a list of files relative to folderConfig.folder
 */
export async function _generateListingForPath(folderConfig, n = folderConfig.quantity, subpath = '', previouslySelected = []) {
	buildingLogger.debug(folderConfig.name, '3.0 - getFilesFromFolderPath: ', subpath, folderConfig);

	const folders = shuffleArray(
		['.']
			.concat(await _getFoldersFromFolder(path.join(folderConfig.folder, subpath), folderConfig.excludes))
	);
	const listing = [];

	while (folders.length > 0 && listing.length < n) {
		const f = folders.pop();

		// Special case: we take the pictures
		if (f == '.') {
			if (previouslySelected.includes(subpath)) {
				// Don't take twice the same folder
				continue;
			}
			previouslySelected.push(subpath);

			buildingLogger.debug(folderConfig.name, '# 3.1 - getFilesFromFolderPath: selecting pictures');

			/** @type {Array<string>} - list of max(n) filename with correct mimetype */
			const images = shuffleArray(await _getFilesFromFolderByMime(
				path.join(folderConfig.folder, subpath),
				folderConfig.excludes,
				folderConfig.mimeTypePattern
			));

			/** @type {Array<string>} - list of filepath relative to folderConfig */
			const imgList = images
				.slice(0, Math.min(n,
					images.length,
					n - listing.length))
				.map(filename => path.join(subpath, filename));
			buildingLogger.debug(folderConfig.name, '# 3.2 - getFilesFromFolderPath: selecting pictures: ', imgList.length, imgList);

			listing.push(...imgList);
			continue;
		}

		// Take folders
		buildingLogger.debug(folderConfig.name, '# 3.3 - getFilesFromFolderPath: selecting folder', f);
		listing.push(...(await _generateListingForPath(
			folderConfig,
			n - listing.length,
			path.join(subpath, f),
			previouslySelected
		)));
	}
	listing.sort();
	return listing;
}

/**
 * To limit exiv execution to 1 at a a time
 */
const exifReaderLimiter = pLimitFactory(1);

/**
 * Build the whole list for a folderConfig
 *
 * @param {FolderConfig} folderConfig of a folder
 * @returns {Array<object>} list of files relative to folder root
 */
export async function _generateListingForTopFolder(folderConfig) {
	buildingLogger.debug(folderConfig.name, '# 2.0 - generateListingForTopFolder: given options: ', folderConfig);

	// Initialize config
	folderConfig = {
		excludes: [],
		mimeTypePattern: ['image/*'],
		quantity: 10,
		...app.getConfig('.folder-defaults', {}),
		...folderConfig,
	};

	// if (folderConfig.folder[0] != '/') {
	// 	folderConfig.folder = path.join(app.getConfig('server.root'), folderConfig.folder);
	// }

	buildingLogger.debug(folderConfig.name, '# 2.1 - generateListingForTopFolder: resolved options: ', folderConfig);
	try {
		fs.statSync(folderConfig.folder);
	} catch (_e) {
		app.error(`Could not find folder '${folderConfig.folder}'`);
		return [];
	}

	/**
	 * @type {Array<string>} of filenames
	 */
	let selectedFolderPictures = await _generateListingForPath(folderConfig);

	// Enrich the data
	buildingLogger.debug(folderConfig.name, '# 2.3 Extracting exif data for files', selectedFolderPictures);

	/**
	 * @type {Array<ImageData>} but without exiv data
	 */
	selectedFolderPictures = selectedFolderPictures
		.map(filepath => ({
			subPath: filepath,
			path: path.join(folderConfig.folder, filepath),
			folderConfig,
		}))
		.map(imageData => {
			imageData.url = encodeURI(imageData.path);
			if (imageData.url[0] != '/') {
				// Relative to
				//  - in "file" mode, relative to the index.html
				//  - in "server" mode, relative to the CWD
				imageData.url = '../' + imageData.url;
			}
			return imageData;
		});

	/**
	 * @type {Array<ImageData>} with exiv data
	 */
	selectedFolderPictures = await Promise.all(
		selectedFolderPictures.map(
			fileObject => exifReaderLimiter(() => exifParser(fileObject.path))
				.catch(e => { app.debug('Could not read exif: ', e); return {}; })
				.then(data => ({
					// TODO: what other information do we need?
					...fileObject,
					data
				}))
		));
	buildingLogger.debug(folderConfig.name, '# 2.4 Extracting exif data done');

	return selectedFolderPictures;
}


/**
 * Make the full selection of the images
 * and store it in the state
 *
 * @param {object} _data to filter the results
 * @returns {object} new state
 */
export async function generateListing(_data = null) {
	app.debug('0. Generate listing');
	let selectedPictures = [];

	// TODO: manage the data selection
	const folders = app.getConfig('.folders', []);
	buildingLogger.debug('1 - generateListing: Found top folders', folders);
	for (const i in folders) {
		const f = folders[i];
		buildingLogger.debug(f.name, ' # 1.1 - generateListing using folder', f);
		selectedPictures = selectedPictures.concat(await _generateListingForTopFolder(f));
	}

	// Sort the images
	selectedPictures.sort((a, b) => {
		if (!a.data.date && !b.data.date) {
			return 0;
		} else if (!a.data.date) {
			return -1;
		} else if (!b.data.date) {
			return 1;
		}
		return a.data.date < b.data.date ? -1 : a.data.date == b.data.date ? 0 : 1;
	});

	buildingLogger.debug('0.2 - Updating listing to', selectedPictures);

	const newState = {
		hasList: true,
		listing: selectedPictures
	};

	app.setState(newState);

	app.debug('0.3 - Generating listing done', newState);
	return newState;
}

/**
 * Initialize the package
 *
 * @returns {module:server/ServerApp} the app
 */
export function init() {
	app.setState({
		hasList: false,
		listing: []
	});

	// We check that we have a list
	app.addTimeInterval(async () => {
		if (!app.getState().hasList) {
			await generateListing();
		}
	}, app.getConfig('.checkListEverySeconds', 5 * 60));

	// // Refresh the list sometimes
	// // On reboot :-)
	// const refreshSchedule = app.getConfig('.refresh-cron', '0 0 5 * * *');
	// app.debug('Programming resfresh at', refreshSchedule);
	// app.cron((data) => generateListing(data), refreshSchedule);

	generateListing();
	return app;
}

init();
