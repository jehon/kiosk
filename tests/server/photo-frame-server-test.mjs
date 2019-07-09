
import { mockableAPI } from'../../server/server-api.mjs';

import * as photoFrameAPI from '../../packages/photo-frame/photo-frame-server.mjs';

function baseConfig() {
	return JSON.parse(JSON.stringify(mockableAPI.getConfig()));
}

describeHere(() => {

	beforeEach(() => {
		spyOn(mockableAPI, 'dispatchToBrowser');
	});

	it('should force regenerate on request', async function() {
		await mockableAPI.dispatch('photo-frame.refresh');
		expect(mockableAPI.dispatchToBrowser).toHaveBeenCalled();
	});

	it('should generate with config', async() =>  {
		let listing = await photoFrameAPI.generateListing();
		expect(mockableAPI.dispatchToBrowser).toHaveBeenCalled();
		expect(listing).not.toBeNull();
		expect(listing.length).toBe(3);
	});

	it('should handle when not enough files are provided', async() =>  {
		let cfg = baseConfig();
		cfg['photo-frame'].folders.photo.folder = cfg['photo-frame'].folders.photo.folder + '/f1';
		mockableAPI.testingConfigOverride(cfg);
		let listing = await photoFrameAPI.generateListing();
		expect(mockableAPI.dispatchToBrowser).toHaveBeenCalled();
		expect(listing).not.toBeNull();
		expect(listing.length).toBe(3);
		mockableAPI.testingConfigRestore();
	});


	it('should handle when not enough files are provided', async() =>  {
		let cfg = baseConfig();
		cfg['photo-frame'].folders.photo.quantity = 100;
		mockableAPI.testingConfigOverride(cfg);
		let listing = await photoFrameAPI.generateListing();
		expect(mockableAPI.dispatchToBrowser).toHaveBeenCalled();
		expect(listing).not.toBeNull();
		expect(listing.length).toBe(7);
		mockableAPI.testingConfigRestore();
	});

	it('should exclude files', async() => {
		let cfg = baseConfig();
		cfg['photo-frame'].folders.photo.quantity = 100;
		cfg['photo-frame'].folders.photo.excludes = [ 'f1' ];
		mockableAPI.testingConfigOverride(cfg);
		let listing = await photoFrameAPI.generateListing();
		expect(mockableAPI.dispatchToBrowser).toHaveBeenCalled();
		expect(listing).not.toBeNull();
		expect(listing.length).toBe(4);
		mockableAPI.testingConfigRestore();
	});

	it('should not fire if no files are found', async () => {
		let cfg = baseConfig();
		cfg['photo-frame'].folders.photo.folder = 'tests/server/data/does_not_exists';
		mockableAPI.testingConfigOverride(cfg);
		let listing = await photoFrameAPI.generateListing();
		expect(listing).toBeNull();
		expect(mockableAPI.dispatchToBrowser).not.toHaveBeenCalled();
		mockableAPI.testingConfigRestore();
	});

	it('should regenerate the listing when changing from date', function() {
		mockableAPI.dispatchToBrowser.calls.reset();
		jasmine.clock().tick(24*60*60*1000);
		expect(mockableAPI.dispatchToBrowser).toHaveBeenCalled();
		expect(photoFrameAPI.getSelectedPictures().length).toBeGreaterThan(2);
	});
});
