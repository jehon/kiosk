
const nock = require('nock');

const host = 'http://localhost';

const { testingConfigOverride, testingConfigRestore } = require('../../server/server-config.js');
const cameraAPI = require('../../packages/camera/camera-server.js');
const { expectBrowserEvent } = require('./helpers.js');

// import spectronApp from './spectron-helper.mjs';

describe(__filename, () => {
	beforeAll(async () => {
		testingConfigOverride({
			camera: {
				host
			}
		});
	});

	afterAll(async () => {
		testingConfigRestore();
	});

	it('should adapt to http conditions', async function () {
		// Install the whole flow
		const nockImage = () => nock(host)
			.filteringPath(_path => '/image.jpg')
			.get('/image.jpg');

		{ // With success...
			nockImage()
				.reply(200, 'ok')
				.persist();

			let l = await expectBrowserEvent('.status', async () => {
				await cameraAPI._check();
				await cameraAPI._check();
				await cameraAPI._check();
			});
			expect(l.length).toBeGreaterThan(0);
			expect(cameraAPI.getStatus().code).toBe(100);
			nock.cleanAll();
		}

		{ // With problem
			nockImage()
				.replyWithError('something awful happened')
				.persist();

			let l = await expectBrowserEvent('.status', async () => {
				await cameraAPI._check();
				expect(cameraAPI.getStatus().code).toBeLessThan(12);
			});
			expect(l.length).toBeGreaterThan(0);
			nock.cleanAll();
		}

		{ // With success again...
			nock.cleanAll();
			nockImage()
				.reply(200, 'ok')
				.persist();

			let l = await expectBrowserEvent('.status', async () => {
				await cameraAPI._check();
				await cameraAPI._check();
				await cameraAPI._check();
				expect(cameraAPI.getStatus().code).toBe(100);
			});
			expect(l.length).toBeGreaterThan(0);
			nock.cleanAll();
		}
		nock.restore();
	});
});
