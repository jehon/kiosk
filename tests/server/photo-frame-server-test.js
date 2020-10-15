
const serverAPIFactory = require('../../server/server-api.js');
const { ServerAPI, testingConfigOverride, testingConfigRestore } = serverAPIFactory;

const photoFrameAPI = require('../../packages/photo-frame/photo-frame-server.js');

const app = serverAPIFactory('photo-frame:test');

/**
 *
 */
function baseConfig() {
	return JSON.parse(JSON.stringify(app.getConfig()));
}

describe(__filename, () => {
	beforeEach(() => {
		spyOn(ServerAPI.prototype, 'dispatchToBrowser');
	});

	it('should force regenerate on request', async function () {
		await photoFrameAPI.generateListing();
		expect(ServerAPI.prototype.dispatchToBrowser).toHaveBeenCalled();
	});

	it('should generate with config', async () => {
		let listing = await photoFrameAPI.generateListing();
		expect(ServerAPI.prototype.dispatchToBrowser).toHaveBeenCalled();
		expect(listing).not.toBeNull();
		expect(listing.length).toBe(3);
	});

	it('should handle when not enough files are provided', async () => {
		let cfg = baseConfig();
		cfg['photo-frame'].folders.photo.folder = cfg['photo-frame'].folders.photo.folder + '/f1';
		testingConfigOverride(cfg);
		let listing = await photoFrameAPI.generateListing();
		expect(ServerAPI.prototype.dispatchToBrowser).toHaveBeenCalled();
		expect(listing).not.toBeNull();
		expect(listing.length).toBe(3);
		testingConfigRestore();
	});


	it('should handle when not enough files are provided', async () => {
		let cfg = baseConfig();
		cfg['photo-frame'].folders.photo.quantity = 100;
		testingConfigOverride(cfg);
		let listing = await photoFrameAPI.generateListing();
		expect(ServerAPI.prototype.dispatchToBrowser).toHaveBeenCalled();
		expect(listing).not.toBeNull();
		expect(listing.length).toBe(7);
		testingConfigRestore();
	});

	it('should exclude files', async () => {
		let cfg = baseConfig();
		cfg['photo-frame'].folders.photo.quantity = 100;
		cfg['photo-frame'].folders.photo.excludes = ['f1'];
		testingConfigOverride(cfg);
		let listing = await photoFrameAPI.generateListing();
		expect(ServerAPI.prototype.dispatchToBrowser).toHaveBeenCalled();
		expect(listing).not.toBeNull();
		expect(listing.length).toBe(4);
		testingConfigRestore();
	});

	it('should not fire if no files are found', async () => {
		let cfg = baseConfig();
		cfg['photo-frame'].folders.photo.folder = 'tests/server/data/does_not_exists';
		testingConfigOverride(cfg);
		let listing = await photoFrameAPI.generateListing();
		expect(listing).toBeNull();
		expect(ServerAPI.prototype.dispatchToBrowser).not.toHaveBeenCalled();
		testingConfigRestore();
	});
});
