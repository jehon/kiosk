
const nock = require('nock');

const host = 'http://localhost';

const { testingConfigOverride, testingConfigRestore } = require('../../server/server-api.js');
const cameraAPI = require('../../packages/camera/camera-server.js');
const { expectBrowserEvent } = require('./test-functions.js');

describe(__filename, () => {
	beforeAll(() => {
		testingConfigOverride({
			camera: {
				host
			}
		});
	});

	afterAll(() => {
		testingConfigRestore();
	});

	it('should adapt to http conditions', async function() {
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
			});
			expect(l[0].enabled).toBeTruthy();
			expect(l[0].dataURI).toBe('data:image/jpeg;base64,b2s=');
			nock.cleanAll();
		}

		{ // With problem
			nockImage()
				.replyWithError('something awful happened')
				.persist();

			let l = await expectBrowserEvent('.status', async () => {
				await cameraAPI._check();
			});
			expect(l[0].enabled).toBeFalsy();
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
			});

			expect(l[0].enabled).toBeTruthy();
			expect(l[0].dataURI).toBe('data:image/jpeg;base64,b2s=');
			nock.cleanAll();
		}
		nock.restore();
	});
});
