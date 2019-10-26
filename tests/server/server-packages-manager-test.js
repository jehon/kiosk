
const packageManager = require('../../server/server-packages.js');

describe(__filename, () => {
	it('should detect packages', async () => {
		const pkgList = await packageManager.getManifests();
		expect(pkgList.length).toBeGreaterThanOrEqual(3);
	});

	it('should detect server packages', async () => {
		await packageManager.getManifests();
		expect(packageManager.manifestListServer.length).toBeGreaterThanOrEqual(3);
	});

	it('should detect client packages', async () => {
		await packageManager.getManifests();
		expect(packageManager.manifestListClient.length).toBeGreaterThanOrEqual(3);
	});
});
