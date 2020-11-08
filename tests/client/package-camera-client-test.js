
import './helper-electron.js';
// import './helper-toastr.js';

import app from '../../packages/camera/camera-client.js';

import { fn } from './helper-main.js';
import { TriStates } from '../../packages/camera/constants.js';

describe(fn(import.meta.url), () => {
	it('should go down', async function () {
		await app._setServerState({
			code: TriStates.DOWN
		});
		expect(app.priority).toBe(0);

		/** @type {module:package/camera/KioskCamera} */
		let mainElement = (/** @type {module:package/camera/KioskCamera} */(app.getMainElement()));

		expect(mainElement.actualUrl).toBe('');
		expect(mainElement.querySelector('video')).toBeNull();
	});

	it('should go up', async function () {
		await app._setServerState({
			code: TriStates.READY,
			url: 'test'
		});
		expect(app.priority).toBe(1000);

		/** @type {module:package/camera/KioskCamera} */
		let mainElement = (/** @type {module:package/camera/KioskCamera} */(app.getMainElement()));

		expect(mainElement.actualUrl).not.toBe('');
		expect(mainElement.querySelector('video')).not.toBeNull();
		expect(mainElement.querySelector('video > source').getAttribute('src')).toBe('test');
	});

	it('should warm up', async function () {
		await app._setServerState({
			code: TriStates.UP_NOT_READY,
			successes: 1,
			nbCheck: 1,
			url: ''
		});
		expect(app.priority).toBe(0);

		/** @type {module:package/camera/KioskCamera} */
		let mainElement = (/** @type {module:package/camera/KioskCamera} */(app.getMainElement()));

		expect(mainElement.actualUrl).toBe('');
		expect(mainElement.querySelector('video')).toBeNull();
	});

	it('should go up, down, up', async function () {
		await app._setServerState({
			code: TriStates.READY,
			url: 'test'
		});

		await app._setServerState({
			code: TriStates.DOWN
		});

		await app._setServerState({
			code: TriStates.READY,
			url: 'test'
		});

		/** @type {module:package/camera/KioskCamera} */
		let mainElement = (/** @type {module:package/camera/KioskCamera} */(app.getMainElement()));

		expect(mainElement.actualUrl).not.toBe('');
		expect(mainElement.querySelector('video')).not.toBeNull();
		expect(mainElement.querySelector('video > source').getAttribute('src')).toBe('test');
	});
});
