
import './helper-electron.js';

import app from '../../packages/camera/camera-client.js';

import { fn } from './helper-main.js';
import { TriStates } from '../../packages/camera/constants.js';
import { priorities } from '../../client/config.js';

describe(fn(import.meta.url), () => {
	beforeEach(async () => {
		await app.setServerState({
			code: TriStates.DOWN
		});
	});

	it('should go down', async function () {
		await app.setServerState({
			code: TriStates.DOWN
		});
		expect(app.priority).toBe(priorities.camera.normal);

		/** @type {module:package/camera/KioskCamera} */
		let mainElement = (/** @type {module:package/camera/KioskCamera} */(app.buildMainElement()));
		mainElement.connectedCallback();

		expect(mainElement.actualUrl).toBe('');
		expect(mainElement.querySelector('video')).toBeNull();

		mainElement.disconnectedCallback();
	});

	it('should go up', async function () {
		await app.setServerState({
			code: TriStates.READY,
			url: 'test'
		});
		expect(app.priority).toBe(priorities.camera.elevated);

		/** @type {module:package/camera/KioskCamera} */
		let mainElement = (/** @type {module:package/camera/KioskCamera} */(app.buildMainElement()));
		mainElement.connectedCallback();


		expect(mainElement.actualUrl).not.toBe('');
		expect(mainElement.querySelector('video')).not.toBeNull();
		expect(mainElement.querySelector('video > source').getAttribute('src')).toBe('test');

		mainElement.disconnectedCallback();
	});

	it('should warm up', async function () {
		await app.setServerState({
			code: TriStates.UP_NOT_READY,
			successes: 1,
			nbCheck: 1,
			url: ''
		});
		expect(app.priority).toBe(priorities.camera.normal);

		/** @type {module:package/camera/KioskCamera} */
		let mainElement = (/** @type {module:package/camera/KioskCamera} */(app.buildMainElement()));
		mainElement.connectedCallback();

		expect(mainElement.actualUrl).toBe('');
		expect(mainElement.querySelector('video')).toBeNull();

		mainElement.disconnectedCallback();
	});

	it('should go up, down, up', async function () {
		await app.setServerState({
			code: TriStates.READY,
			url: 'test'
		});

		await app.setServerState({
			code: TriStates.DOWN
		});

		await app.setServerState({
			code: TriStates.READY,
			url: 'test'
		});

		/** @type {module:package/camera/KioskCamera} */
		let mainElement = (/** @type {module:package/camera/KioskCamera} */(app.buildMainElement()));
		mainElement.connectedCallback();

		expect(mainElement.actualUrl).not.toBe('');
		expect(mainElement.querySelector('video')).not.toBeNull();
		expect(mainElement.querySelector('video > source').getAttribute('src')).toBe('test');

		mainElement.disconnectedCallback();
	});
});
