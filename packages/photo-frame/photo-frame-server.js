
const fs = require('fs');
const mime = require('mime-types');
const shuffleArray = require('shuffle-array');
const path = require('path');
const minimatch = require('minimatch');

// See https://nodejs.org/dist/latest-v12.x/docs/api/modules.html#modules_module_createrequire_filename
const pLimitFactory = require('p-limit');

const exifParser = require('./exif-parser.js');

const exifReaderLimiter = pLimitFactory(1);

const serverAPIFactory = require('../../server/server-api.js');
const app = serverAPIFactory('photo-frame');

const buildingLogger = app.getChildLogger('building');

// Historical files, to avoid taking twice the same folder
let hasAnUpdatedList = false;
let selectedPictures = [];
const previouslySelected = [];

function getFilesFromFolder(folderConfig) {
	return fs.readdirSync(folderConfig.folder)
		.filter(file => !(file in ['.', '..']))
		.filter(file => folderConfig.excludes.reduce((acc, val) => acc && !minimatch(file, val), true));
}

function getFilesFromFolderByMime(folderConfig) {
	return getFilesFromFolder(folderConfig)
		.filter(f => {
			let mt = mime.lookup(path.join(folderConfig.folder, f));
			if (typeof (mt) != 'string') {
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
	buildingLogger.debug(folderConfig.folder, '3.0 - getFilesFromFolderPath: ', folderConfig);
	// Symlinks are resolved to allow thumbnails to be more precisely generated
	// but Samba does not allow links, so they are resolved by samba
	// and invisible here
	// let folder = fs.realpathSync(folderLinked);

	const folders = shuffleArray(['.'].concat(getFoldersFromFolder(folderConfig)));
	const listing = [];

	while (folders.length > 0 && listing.length < folderConfig.quantity) {
		const f = folders.pop();

		// Special case: we take the pictures
		if (f == '.') {
			if (previouslySelected.includes(folderConfig.folder)) {
				// Don't take twice the same folder
				continue;
			}
			previouslySelected.push(folderConfig.folder);

			buildingLogger.debug(folderConfig.folder, '# 3.1 - getFilesFromFolderPath: selecting pictures');
			const images = shuffleArray(getFilesFromFolderByMime(folderConfig));
			const imgList = images
				.slice(0, Math.min(folderConfig.quantity,
					images.length,
					folderConfig.quantity - listing.length))
				.map(e => path.join(folderConfig.folder, e));
			buildingLogger.debug(folderConfig.folder, '# 3.2 - getFilesFromFolderPath: selecting pictures: ', imgList.length, imgList);

			listing.push(... (imgList.map(filepath => { filepath, folderConfig; })));
			continue;
		}

		// Take folders
		buildingLogger.debug(folderConfig.folder, '# 3.3 - getFilesFromFolderPath: selecting folder');
		listing.push(...generateListingForPath({
			...folderConfig,
			folder: path.join(folderConfig.folder, f),
			quantity: folderConfig.quantity - listing.length
		}));
	}
	return listing;
}

function generateListingForTopFolder(folderConfig) {
	buildingLogger.debug(folderConfig.folder, '# 2.0 - generateListingForTopFolder: given options: ', folderConfig);
	folderConfig = {
		excludes: [],
		mimeTypePattern: ['image/*'],
		quantity: 10,
		...app.getConfig('.folder-defaults', {}),
		...folderConfig,
	};

	if (folderConfig.folder[0] != '/') {
		folderConfig.folder = path.join(app.getConfig('server.root'), folderConfig.folder);
	}

	buildingLogger.debug(folderConfig.folder, '# 2.1 - generateListingForTopFolder: resolved options: ', folderConfig);
	try {
		fs.statSync(folderConfig.folder);
	} catch (_e) {
		app.error(`Could not find folder '${folderConfig.folder}'`);
		return [];
	}

	let selectedFolderPictures = generateListingForPath(folderConfig);
	buildingLogger.debug(folderConfig.folder, '# 2.2 - generateListingForTopFolder: found file list ', selectedFolderPictures);
	return selectedFolderPictures;
}

//
// Main entry-point
//  -> Generate a selection
//
async function generateListing(_data = null) {
	app.debug('Generate listing');
	hasAnUpdatedList = false;
	previouslySelected.length = 0;
	let newSelectedPictures = [];

	// TODO: manage the data selection
	const folders = app.getConfig('.folders', []);
	buildingLogger.debug('1 - generateListing: Found top folders', folders);
	for (const i in folders) {
		const f = folders[i];
		buildingLogger.debug('1.1 - generateListing: Using folder', f);
		newSelectedPictures = newSelectedPictures.concat(generateListingForTopFolder(f));
	}

	if (newSelectedPictures.length == 0) {
		app.error('Generate listing: Nothing found in generated JSON!');
		return null;
	}

	buildingLogger.debug('Extracting exif data for all files');
	newSelectedPictures = await Promise.all(
		newSelectedPictures.map(
			img => exifReaderLimiter(() => exifParser(img.filepath))
				.catch(e => { app.debug('Could not read exif: ', e); return {}; })
				.then(data => ({ ...img, data }))
		));
	buildingLogger.debug('Extracting exif data done');

	newSelectedPictures.sort((a, b) => {
		return a.data.date < b.data.date ? -1 : a.data.date == b.data.date ? 0 : 1;
	});

	newSelectedPictures = newSelectedPictures.map(f => { f.url = encodeURI(f.filepath); return f; });

	selectedPictures = newSelectedPictures;
	hasAnUpdatedList = true;
	buildingLogger.debug('Updating listing to', selectedPictures);
	app.dispatchToBrowser('.listing');

	app.debug('Generating listing done');
	return selectedPictures;
}
module.exports.generateListing = generateListing;

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
app.subscribe('.check-has-list', async () => {
	if (selectedPictures.length == 0 || !hasAnUpdatedList) {
		await generateListing();
	}
});

// Refresh the list sometimes
const refreshSchedule = app.getConfig('.refresh-cron', '0 0 5 * * *');
app.debug('Programming resfresh at', refreshSchedule);
app.addSchedule('.refresh', refreshSchedule);
app.subscribe('.refresh', (data) => generateListing(data));

// Force a first go !
app.dispatch('.refresh');

module.exports.getSelectedPictures = function getSelectedPictures() {
	return selectedPictures;
};

