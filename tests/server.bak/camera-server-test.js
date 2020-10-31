
const nock = require('nock');

const host = 'localhost';

const { testingConfigOverride, testingConfigRestore } = require('../../server/server-config.js');
const cameraAPI = require('../../packages/camera/camera-server.js');
const { expectBrowserEvent } = require('./helpers.js');
const { TriStates } = require('../../packages/camera/constants.js');

// import spectronApp from './spectron-helper.mjs';

describe(__filename, () => {
	const nockImage = () => nock('http://localhost:88')
		.filteringPath(_path => '/cgi-bin/CGIProxy.fcgi')
		.get('/cgi-bin/CGIProxy.fcgi');

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

		{ // With success...
			nockImage()
				.reply(200, 'ok')
				.persist();


			let l = await expectBrowserEvent('.status', async () => {
				await cameraAPI._check(); // Finish the currently running check who might not have the mock in place
				await cameraAPI._check();
				await cameraAPI._check();
				await cameraAPI._check();
			});
			expect(l.length).toBeGreaterThan(0);
			expect(cameraAPI.getStatus().code).toBe(TriStates.READY);
			nock.cleanAll();
		}

		{ // With problem
			nockImage()
				.replyWithError('something awful happened')
				.persist();

			let l = await expectBrowserEvent('.status', async () => {
				await cameraAPI._check(); // Finish the currently running check who might not have the mock in place
				await cameraAPI._check();
				expect(cameraAPI.getStatus().code).toBe(TriStates.DOWN);
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
				await cameraAPI._check(); // Finish the currently running check who might not have the mock in place
				await cameraAPI._check();
				await cameraAPI._check();
				await cameraAPI._check();
				expect(cameraAPI.getStatus().code).toBe(TriStates.READY);
			});
			expect(l.length).toBeGreaterThan(0);
			nock.cleanAll();
		}
		nock.restore();
	});
});
