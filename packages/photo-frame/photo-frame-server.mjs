
import fs from 'fs';
import mime from 'mime-types';
import shuffleArray from 'shuffle-array';
import path from 'path';
import minimatch from 'minimatch';

import exifParser from './exif-parser.js';

import serverAPIFactory from '../../server/server-api.mjs';
const app = serverAPIFactory('photo-frame');


// Thanks to https://github.com/ungap/promise-all-settled/blob/master/index.js
const allSettled = Promise.allSettled || function ($) {
	return Promise.all(
		$.map(
			function (value) {
				return Promise.resolve(value).then(this.$).catch(this._);
			},
			{
				$: function (value) {
					return { status: 'fulfilled', value: value };
				},
				_: function (reason) {
					return { status: 'rejected', reason: reason };
				}
			}
		)
	);
};


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
	app.debug(folderConfig.folder ,'3.0 - getFilesFromFolderPath: ', folderConfig);
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

			app.debug(folderConfig.folder, '# 3.1 - getFilesFromFolderPath: selecting pictures');
			const images = shuffleArray(getFilesFromFolderByMime(folderConfig));
			const imgList = images
				.slice(0, Math.min(folderConfig.quantity,
					images.length,
					folderConfig.quantity - listing.length))
				.map(e => path.join(folderConfig.folder, e));
			app.debug(folderConfig.folder, '# 3.2 - getFilesFromFolderPath: selecting pictures: ', imgList.length, imgList);

			listing.push(...imgList);
			continue;
		}

		// Take folders
		app.debug(folderConfig.folder, '# 3.3 - getFilesFromFolderPath: selecting folder');
		listing.push(...generateListingForPath({
			...folderConfig,
			folder: path.join(folderConfig.folder, f),
			quantity: folderConfig.quantity - listing.length
		}));
	}
	return listing;
}

function generateListingForTopFolder(folderConfig) {
	app.debug(folderConfig.folder, '# 2.0 - generateListingForTopFolder: given options: ', folderConfig);
	folderConfig = {
		excludes: [],
		mimeTypePattern: [ 'image/*' ],
		quantity: 10,
		...app.getConfig('.folder-defaults', {}),
		...folderConfig,
	};

	app.debug(folderConfig.folder, '# 2.1 - generateListingForTopFolder: resolved options: ', folderConfig);
	try {
		fs.statSync(folderConfig.folder);
	} catch(_e) {
		app.error(`Could not find folder '${folderConfig.folder}'`);
		return [];
	}

	let selectedFolderPictures = generateListingForPath(folderConfig);
	app.debug(folderConfig.folder, '# 2.2 - generateListingForTopFolder: found file list ', selectedFolderPictures);
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
	app.info('Generate listing');
	hasAnUpdatedList = false;
	previouslySelected.length = 0;
	let newSelectedPictures = [];

	// TODO: manage the data selection
	const folders = app.getConfig('.folders', []);
	app.debug('1 - generateListing: Found top folders', folders);
	for(const i in folders) {
		const f = folders[i];
		app.debug('1.1 - generateListing: Using folder', f);
		newSelectedPictures = newSelectedPictures.concat(generateListingForTopFolder(f).map(file => ({
			webname: os2web(f.folder, f.publishedAt, file),
			original: file,
		})));
	}

	if (newSelectedPictures.length == 0) {
		app.error('Generate listing: Nothing found in generated JSON!');
		return null;
	}

	app.debug('Extracting exif data for all files');
	// TODO URGENT: need to throttle this !
	newSelectedPictures = await Promise.all(newSelectedPictures.map(f => exifParser(f.original)
			.then(data => { f.data = data; return f; })
			.catch(e => { app.info('Could not read exif: ', e); return f; })
	app.debug('Extracting exif data done');

	newSelectedPictures.sort((a, b) => {
		return a.date < b.date ? -1 : a.date == b.date ? 0 : 1;
	});

	selectedPictures = newSelectedPictures;
	hasAnUpdatedList = true;
	app.debug('Sending to browser', selectedPictures);
	app.dispatchToBrowser('.listing', selectedPictures);

	app.info('Generating listing done');
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
const checkHasListSchedule = app.getConfig('.check-cron', '0 0/5 * * * *');
app.debug('Programming checking for presence of listing at', checkHasListSchedule);
app.addSchedule('.check-has-list', checkHasListSchedule);
app.subscribe('.check-has-list', () => {
	if (selectedPictures.length == 0 || !hasAnUpdatedList) {
		generateListing();
	}
});

// Refresh the list sometimes
const refreshSchedule  = app.getConfig('.refresh-cron', '0 0 5 * * *');
app.debug('Programming resfresh at', refreshSchedule);
app.addSchedule('.refresh', refreshSchedule);
app.subscribe('.refresh', (data) => generateListing(data));

// Force a first go !
app.dispatch('.refresh');

// Register some routing functions
app.getExpressApp().get('/photo-frame/refresh', (_req, res, _next) => {
	// TODO: allow to generate from a specific folder?
	app.dispatch('.refresh', null);
	res.json(selectedPictures);
});

export function getSelectedPictures() {
	return selectedPictures;
}
