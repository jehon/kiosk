
import getConfig, { setConfig } from '../../server/server-lib-config.js';
import app, { init, _check } from '../../packages/camera/camera-server.mjs';
import { TriStates } from '../../packages/camera/constants.js';

import { fn } from './at-helper.mjs';

import nock from 'nock';

describe(fn(import.meta.url), () => {
	let beforeConfig = {};
	let nockImage;

	beforeAll(() => {
		beforeConfig = getConfig('');
		setConfig('camera', {
			host: 'localhost',
			port: 88
		});
		const mockUrl = `http://${app.getConfig('.host')}:${app.getConfig('.port')}`;
		console.log('mockurl', mockUrl);
		nockImage = () => nock(mockUrl)
			.filteringPath(_path => '/cgi-bin/CGIProxy.fcgi')
			.get('/cgi-bin/CGIProxy.fcgi');

	});

	beforeEach(() => {
		nock.cleanAll();
	});

	afterAll(() => {
		setConfig('', beforeConfig);
		nock.restore();
	});

	it('should adapt to http conditions', async function () {
		// Install the whole flow

		{ // With success...
			nockImage()
				.reply(200, 'ok')
				.persist();

			init();

			await _check(); // Finish the currently running check who might not have the mock in place
			await _check();
			await _check();
			await _check();

			expect(app.getState().code).toBe(TriStates.READY);
			nock.cleanAll();
		}

		{ // With problem
			nockImage()
				.replyWithError('something awful happened')
				.persist();

			await _check(); // Finish the currently running check who might not have the mock in place
			await _check();
			expect(app.getState().code).toBe(TriStates.DOWN);
			nock.cleanAll();
		}

		{ // With success again...
			nockImage()
				.reply(200, 'ok')
				.persist();

			await _check(); // Finish the currently running check who might not have the mock in place
			await _check();
			await _check();
			await _check();
			expect(app.getState().code).toBe(TriStates.READY);
			nock.cleanAll();
		}
	});
});
