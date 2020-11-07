
import { CameraAPI } from '../constants.js';
import fetch from 'node-fetch';
import path from 'path';

import { getUrl } from './foscam-r2m-common.js';
import { createWorker, masterOnMessage, __dirname } from '../../../server/server-lib-worker.js';

/**
 * @type {module:packages/camera/CameraAPI}
 */
export default class extends CameraAPI {
	defaultConfig() {
		return {
			configure: true,
			videoPort: 0,
			port: 88,
		};
	}

	async check() {
		return fetch(getUrl('health check', this.app, this.config, { cmd: 'getDevInfo' }), { method: 'GET' })
			.then(response => {
				if (!response.ok) {
					this.app.debug('Check response error', response);
					throw new Error(response.status + ': ' + response.statusText);
				}
				this.app.debug('Check successfull');
				return true;
			}, err => {
				this.app.debug('Camera in error', err);
				throw err;
			});
	}

	async up() {
		if (this.worker) {
			await this.down();
		}
		return new Promise((resolve) => {
			this.worker = createWorker(path.join(__dirname(import.meta.url), 'foscam-r2m-worker.js'), this.app, this.config);

			masterOnMessage(this.worker, 'url', (url) => {
				this.app.debug('Url is ', url);
				if (!url) {
					return;
				}
				resolve(url);
			});
		});
	}

	async down() {
		if (this.worker) {
			this.worker.terminate();
			this.worker = null;
		}
	}
}
