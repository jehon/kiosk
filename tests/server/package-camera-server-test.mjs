
import getConfig, { setConfig } from '../../server/server-lib-config.js';
import app, { init, _check } from '../../packages/camera/camera-server.mjs';
import { TriStates } from '../../packages/camera/constants.js';

import { fn } from './helper-main.mjs';

import nock from 'nock';

describe(fn(import.meta.url), () => {
	let beforeConfig = {};
	let nockImage;

	beforeAll(() => {
		// backup config
		beforeConfig = getConfig('');

		// install our config and mock
		setConfig('camera', {
			cron: '',
			hardware: {
				host: 'localhost',
				port: 88
			}
		});
		const mockUrl = `http://${app.getConfig('.hardware.host')}:${app.getConfig('.hardware.port')}`;
		nockImage = () => nock(mockUrl)
			.filteringPath(_path => '/cgi-bin/CGIProxy.fcgi')
			.get('/cgi-bin/CGIProxy.fcgi');

	});

	beforeEach(async () => {
		// Wait for last check to finish
		await init();
		nock.cleanAll();
	});

	afterAll(() => {
		// restore config
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

			let state;

			await _check();
			state = app.getState();
			expect(state.code).toBe(TriStates.UP_NOT_READY);
			expect(state.message).not.toBe('');
			expect(state.successes).toBe(1);
			expect(state.nbCheck).toBe(3);
			expect(state.url).toBe('');

			await _check();
			state = app.getState();
			expect(state.code).toBe(TriStates.UP_NOT_READY);
			expect(state.message).not.toBe('');
			expect(state.successes).toBe(2);
			expect(state.url).toBe('');

			await _check();
			state = app.getState();
			expect(state.code).toBe(TriStates.READY);
			expect(state.message).not.toBe('');
			expect(state.successes).toBe(state.nbCheck);
			expect(state.url).not.toBe('');
			let url = state.url;

			await _check();
			state = app.getState();
			expect(state.code).toBe(TriStates.READY);
			expect(state.message).not.toBe('');
			expect(state.successes).toBe(state.nbCheck);
			expect(state.url).not.toBe('');
			// Url does not change
			expect(state.url).toBe(url);
			nock.cleanAll();
		}

		{ // With problem
			nockImage()
				.replyWithError('something awful happened')
				.persist();

			let state;

			await _check();

			state = app.getState();
			expect(state.code).toBe(TriStates.DOWN);
			expect(state.message).not.toBe('');
			expect(state.successes).toBe(0);
			expect(state.url).toBe('');
			nock.cleanAll();
		}

		{ // With success again...
			nockImage()
				.reply(200, 'ok')
				.persist();

			let state;

			await _check();
			state = app.getState();
			expect(state.code).toBe(TriStates.UP_NOT_READY);
			expect(state.message).not.toBe('');
			expect(state.successes).toBe(1);
			expect(state.nbCheck).toBe(3);
			expect(state.url).toBe('');

			await _check();
			await _check();

			state = app.getState();
			expect(state.code).toBe(TriStates.READY);
			expect(state.message).not.toBe('');
			expect(state.successes).toBe(state.nbCheck);
			expect(state.url).not.toBe('');
			nock.cleanAll();
		}
	});
});
