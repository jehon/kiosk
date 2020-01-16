
import nock from 'nock';

const host = 'http://localhost';

import getConfig from '../../server/server-config.js';
const { testingConfigOverride, testingConfigRestore } = getConfig;
import cameraAPI from'../../packages/camera/camera-server.js';
import { expectBrowserEvent } from './helpers.mjs';

import spectronApp from './spectron-helper.mjs';

describe(import.meta.url, () => {
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
