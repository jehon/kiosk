
import * as packageManager from '../../server/server-packages-manager.mjs';

describeHere(() => {
	it('should detect packages', async () => {
		const pkgList = await packageManager.getManifests();
		expect(pkgList.length).toBeGreaterThanOrEqual(3);
	});

	it('should detect server packages', async () => {
		const pkgList = await packageManager.getServerFiles();
		expect(pkgList.length).toBeGreaterThanOrEqual(3);
	});

	it('should detect client packages', async () => {
		const pkgList = await packageManager.getServerFiles();
		expect(pkgList.length).toBeGreaterThanOrEqual(3);
	});
});
