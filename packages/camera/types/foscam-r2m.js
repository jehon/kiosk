
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
		const url = getUrl('health check', this.app, this.config, { cmd: 'getDevInfo' });
		this.logger.debug('checking ', { url, config: this.config });

		return fetch(url, { method: 'GET' })
			.then(response => {
				this.logger.debug('Check done', response.statusText);
				if (!response.ok) {
					this.app.debug('Check response error', response);
					throw new Error(response.status + ': ' + response.statusText);
				}
				this.logger.debug('Check successfull');
				return true;
			}, err => {
				this.logger.debug('Camera in error', err);
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
				this.logger.debug('Url is ', url);
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
