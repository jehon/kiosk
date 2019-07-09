
import nock from 'nock';

const host = 'http://127.0.0.1';

import { mockableAPI } from '../../server/server-api.mjs';
import * as cameraAPI from'../../packages/camera/camera-server.mjs';
import { expectBrowserEvent } from './helpers.mjs';

describeHere(() => {
	beforeAll(() => {
		mockableAPI.testingConfigOverride({
			camera: {
				host
			}
		});
	});

	afterAll(() => {
		mockableAPI.testingConfigRestore();
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

			let l = await expectBrowserEvent('camera.status', async () => {
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

			let l = await expectBrowserEvent('camera.status', async () => {
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

			let l = await expectBrowserEvent('camera.status', async () => {
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
