
/**
 * @readonly
 * @enum {string}
 */
export const TriStates = {
	/** Could show the video feed */
	READY: 'READY',
	/** Camera is up, but video feed is not ready */
	UP_NOT_READY: 'UP_NOT_READY',
	/** Camera is completely down */
	DOWN: 'DOWN'
};
Object.freeze(TriStates);

/**
 * @typedef CheckResponse
 * @property {TriStates} state - the state of the camera
 * @property {string} message  - a message to show to the user
 */

/**
 * @typedef Status
 * @property {string} message - user friendly message
 * @property {TriStates} code - see above
 * @property {number} successes - number of TriStates.READY received
 * @property {string} url of the video feed
 */

export class CameraAPI {
	constructor(app, config) {
		this.app = app;
		this.config = {
			'cron-recheck': '*/10 * * * * *',
			host: 'localhost',
			port: 80,
			username: '',
			password: '',
			nbCheck: 3,
			...this.defaultConfig(),
			...config
		};

		/**
		 * @type {Status}
		 */
		this.status = {
			message: '',
			code: TriStates.DOWN,
			successes: 0,
			url: ''
		};
	}

	defaultConfig() { return {}; }
	async check() { }
	async up() { }
	async down() { }
}
