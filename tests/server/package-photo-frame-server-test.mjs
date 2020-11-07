
import path from 'path';

import app, {
	init,
	_getFilesFromFolder,
	_getFilesFromFolderByMime,
	_getFoldersFromFolder,
	_generateListingForPath,
	_generateListingForTopFolder,
	generateListing
} from '../../packages/photo-frame/photo-frame-server.mjs';
import getConfig, { setConfig } from '../../server/server-lib-config.js';

import { fn } from './helper-main.mjs';

const testFolderConfig = {
	'name': 'photo',
	'folder': 'tests/server/data/photo-frame',
	'quantity': 5,
	'mimeTypePattern': 'image/*',
	'excludes': []
};

describe(fn(import.meta.url), () => {
	let beforeConfig = {};
	beforeAll(() => {
		beforeConfig = getConfig('');
	});

	beforeEach(() => {
		setConfig('photo-frame', JSON.parse(JSON.stringify({
			'folders': {
				'photo': testFolderConfig
			}
		})));
	});

	afterAll(() => {
		setConfig('', beforeConfig);
	});

	it('should _getFilesFromFolder', async function () {
		expect(await _getFilesFromFolder(testFolderConfig.folder)).toEqual(['f1', 'f2']);
		expect(await _getFilesFromFolder(testFolderConfig.folder, ['f1'])).toEqual(['f2']);
	});

	it('should _getFoldersFromFolder', async function () {
		expect(await _getFoldersFromFolder(testFolderConfig.folder, [])).toEqual(['f1', 'f2']);
	});

	it('should _getFilesFromFolderByMime', async function () {
		expect(await _getFilesFromFolderByMime(testFolderConfig.folder)).toEqual([]);
		expect(await _getFilesFromFolderByMime(
			path.join(testFolderConfig.folder, 'f1'),
			[],
			'image/*'
		)).toEqual(['i1.png', 'i2.jpg', 'i4.jpg']);
	});

	it('should _generateListingForPath', async function () {
		expect(await _generateListingForPath(testFolderConfig, 10, 'f1'))
			.toEqual([
				'f1/i1.png',
				'f1/i2.jpg',
				'f1/i4.jpg'
			]);

		expect(await _generateListingForPath(testFolderConfig, 10, '', ['f2']))
			.toEqual([
				'f1/i1.png',
				'f1/i2.jpg',
				'f1/i4.jpg'
			]);

		expect(await _generateListingForPath(testFolderConfig, 100))
			.toEqual([
				'f1/i1.png',
				'f1/i2.jpg',
				'f1/i4.jpg',
				'f2/m1.jpg',
				'f2/m2.jpg',
				'f2/m3.jpg',
				'f2/m4.jpg'
			]);
	});

	it('should _generateListingForTopFolder', async function () {
		expect((await _generateListingForTopFolder({
			...testFolderConfig,
			quantity: 100
		})).length)
			.toBe(7);

		// Only a few
		expect((await _generateListingForTopFolder({
			...testFolderConfig,
			quantity: 2
		})).length)
			.toBe(2);

		// Accross two folders minimum
		expect((await _generateListingForTopFolder({
			...testFolderConfig,
			quantity: 5
		})).length)
			.toBe(5);
	});

	it('should _generateListingForTopFolder with correct properties', async function () {
		const cfg = {
			...testFolderConfig,
			quantity: 100
		};
		const res0 = (await _generateListingForTopFolder(cfg))[0];

		expect(res0)
			.toEqual({
				subPath: 'f1/i1.png',
				path: 'tests/server/data/photo-frame/f1/i1.png',
				url: '../tests/server/data/photo-frame/f1/i1.png', // UNUSED
				data: {
					comment: 'Test comment here',
					date: '2019-07-01 02:03:04',
					orientation: 0
				},
				folderConfig: {
					...testFolderConfig,
					quantity: 100
				}
			});
	});

	it('should generateListing', async function () {
		const newState = await generateListing();
		expect(newState.hasList).toBeTrue();
		expect(newState.listing.length).toBeGreaterThan(0);
		expect(app.getState().hasList).toBeTrue();
		expect(app.getState().listing.length).toBeGreaterThan(0);
	});

	it('should handle when no files are found', async () => {
		setConfig('photo-frame.folders.photo.folder', 'tests/server/data/does_not_exists');
		const newState = await generateListing();
		expect(newState.hasList).toBeTrue();
		expect(newState.listing).toEqual([]);
		expect(app.getState().hasList).toBeTrue();
		expect(app.getState().listing.length).toBe(0);
	});

	it('should init', async function () {
		expect(init()).toBeDefined();
	});

});
