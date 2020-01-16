
import * as packageManager from '../../server/server-packages.js';

describe(import.meta.url, () => {
	it('should detect packages', async () => {
		const pkgList = await packageManager.getManifests();
		expect(pkgList.length).toBeGreaterThanOrEqual(3);
	});

	it('should detect server packages', async () => {
		await packageManager.getManifests();
		const pkgList = packageManager.manifestListServer;
		expect(pkgList.length).toBeGreaterThanOrEqual(3);
	});

	it('should detect client packages', async () => {
		await packageManager.getManifests();
		const pkgList = packageManager.manifestListClient;
		expect(pkgList.length).toBeGreaterThanOrEqual(3);
	});
});
