
import fs from 'fs';
import mime from 'mime-types';
import shuffleArray from 'shuffle-array';
import path from 'path';
import minimatch from 'minimatch';

import exifParser from './exif-parser.js';

import serverAPIFactory from '../../server/server-api.mjs';
const serverAPI = serverAPIFactory('photo-frame');
const logger = serverAPI.logger;

// Historical files, to avoid taking twice the same folder
let hasAnUpdatedList = false;
let selectedPictures = [];
const previouslySelected = [];

function getFilesFromFolder(folderConfig) {
	return fs.readdirSync(folderConfig.folder)
		.filter(file => !(file in [ '.', '..' ]))
		.filter(file => folderConfig.excludes.reduce((acc, val) => acc && !minimatch(file, val), true))
	;
}

function getFilesFromFolderByMime(folderConfig) {
	return getFilesFromFolder(folderConfig)
		.filter(f => {
			let mt = mime.lookup(path.join(folderConfig.folder, f));
			if (typeof(mt) != 'string') {
				return false;
			}
			return mt.match(folderConfig.mimeTypePattern);
		});
}

function getFoldersFromFolder(folderConfig) {
	return getFilesFromFolder(folderConfig)
		.filter(f => fs.statSync(path.join(folderConfig.folder, f)).isDirectory());
}

//
// Real Business ...
//

/**
 *
 * @param folderLinked
 * @param maxQuantity: the maximum quantity related to what has already be taken
 * @param folderConfig
 */
function generateListingForPath(folderConfig) {
	logger.trace(folderConfig.folder ,'3 - getFilesFromFolderPath: ', folderConfig);
	// Symlinks are resolved to allow thumbnails to be more precisely generated
	// but Samba does not allow links, so they are resolved by samba
	// and invisible here
	// let folder = fs.realpathSync(folderLinked);

	const folders = shuffleArray([ '.' ].concat(getFoldersFromFolder(folderConfig)));
	const listing = [];

	while(folders.length > 0 && listing.length < folderConfig.quantity) {
		const f = folders.pop();

		// Special case: we take the pictures
		if (f == '.') {
			if (previouslySelected.includes(folderConfig.folder)) {
				// Don't take twice the same folder
				continue;
			}
			previouslySelected.push(folderConfig.folder);

			logger.trace(folderConfig.folder, '# 3 - getFilesFromFolderPath: selecting pictures');
			const images = shuffleArray(getFilesFromFolderByMime(folderConfig));
			const imgList = images
				.slice(0, Math.min(folderConfig.quantity,
					images.length,
					folderConfig.quantity - listing.length))
				.map(e => path.join(folderConfig.folder, e));
			logger.trace(folderConfig.folder, '# 3 - getFilesFromFolderPath: selecting pictures: ', imgList.length, imgList);

			listing.push(...imgList);
			continue;
		}

		// Take folders
		logger.trace(folderConfig.folder, '# 3 - getFilesFromFolderPath: selecting folder');
		listing.push(...generateListingForPath({
			...folderConfig,
			folder: path.join(folderConfig.folder, f),
			quantity: folderConfig.quantity - listing.length
		}));
	}
	return listing;
}

function generateListingForTopFolder(folderConfig) {
	logger.trace(folderConfig.folder, '# 2 - generateListingForTopFolder: given options: ', folderConfig);
	folderConfig = {
		excludes: [],
		mimeTypePattern: [ 'image/*' ],
		quantity: 10,
		...serverAPI.getConfig('.folder-defaults', {}),
		...folderConfig,
	};

	logger.trace(folderConfig.folder, '# 2 - generateListingForTopFolder: resolved options: ', folderConfig);
	try {
		fs.statSync(folderConfig.folder);
	} catch(_e) {
		logger.error(`Could not find folder '${folderConfig.folder}'`);
		return [];
	}

	let selectedFolderPictures = generateListingForPath(folderConfig);
	logger.trace(folderConfig.folder, '# 2 - generateListingForTopFolder: found file list ', selectedFolderPictures);
	return selectedFolderPictures;
}

function os2web(os, web, f) { // TODO: this should be in package "shares"
	return f.replace(os, web);
}

//
// Main entry-point
//  -> Generate a selection
//
export async function generateListing(_data = null) {
	logger.info('Generate listing');
	hasAnUpdatedList = false;
	previouslySelected.length = 0;
	let newSelectedPictures = [];

	// TODO: manage the data selection
	const folders = serverAPI.getConfig('.folders', []);
	logger.trace('1 - generateListing: Found top folders', folders);
	for(const i in folders) {
		const f = folders[i];
		logger.trace('1 - generateListing: Using folder', f);
		newSelectedPictures = newSelectedPictures.concat(generateListingForTopFolder(f).map(file => ({
			webname: os2web(f.folder, f.publishedAt, file),
			original: file,
		})));
	}

	if (newSelectedPictures.length == 0) {
		logger.error('Generate listing: Nothing found in generated JSON!');
		return null;
	}

	newSelectedPictures = await Promise.all(newSelectedPictures.map(f => exifParser(f.original)
		.then(data => { f.data = data; return f; })));

	newSelectedPictures.sort((a, b) => {
		return a.date < b.date ? -1 : a.date == b.date ? 0 : 1;
	});

	selectedPictures = newSelectedPictures;
	hasAnUpdatedList = true;
	serverAPI.dispatchToBrowser('.listing', selectedPictures);

	logger.info('Generating listing done');
	return selectedPictures;
}

// ********************************************
//
// Configuration
// Timing
// Routing
// ...
//
// ********************************************


// We check that we have a list
serverAPI.addSchedule('.check-has-list', serverAPI.getConfig('.check-cron', '0 0/5 * * * *'));
serverAPI.subscribe('.check-has-list', () => {
	if (selectedPictures.length == 0 || !hasAnUpdatedList) {
		generateListing();
	}
});

// Refresh the list sometimes
serverAPI.addSchedule('.refresh', serverAPI.getConfig('.refresh-cron', '0 0 5 * * *'));
serverAPI.subscribe('.refresh', (data) => generateListing(data));
// Let's go
serverAPI.dispatch('.refresh');

// Register some routing functions
const app = serverAPI.getExpressApp();
app.get('/photo-frame/refresh', (_req, res, _next) => {
	// TODO: allow to generate from a specific folder?
	serverAPI.dispatch('.refresh', null);
	res.json(selectedPictures);
});

export function getSelectedPictures() {
	return selectedPictures;
}
