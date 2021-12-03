
import App from '../common/app.js';

import cronstrue from 'cronstrue'; // https://www.npmjs.com/package/crontrue
import cronParser from 'cron-parser';

import getConfig from './server-lib-config.js';
import { dispatchToBrowser } from './server-lib-gui.js';
import { serverLoggerFactory } from './server-customs.js';

export class ServerApp extends App {
	constructor(name) {
		super(name,
			(namespace) => serverLoggerFactory(namespace + ':server')
		);

		this.onStateChange(
			(state) => dispatchToBrowser(this.ctxize('.status'), state)
		);
	}

	/**
	 * Get some config if it exists, return def otherwise
	 *
	 * @param {string} [opath] the path in the json
	 * @param {*} [def] - the default value if the key is not found
	 * @returns {object|any} the key or def(null) if it does not exists
	 */
	getConfig(opath = '.', def = null) {
		return getConfig(this.ctxize(opath), def);
	}

	/**
	 * @param {Function} cb callback
	 * @param {string} cron 5 stars (min hours dom month[1-12] dow[0sun-6]) (if empty, make nothing [usefull for testing])
	 * @param {number} duration in minutes
	 * @param {*} data to pass to the signal (will be completed)
	 * @returns {Function} stop to halt the cron
	 */
	cron(cb, cron, duration = 0, data = {}) {
		// TODO: cron could be an array

		if (cron == '') {
			return () => { };
		}

		/**
		 * When cron is triggered
		 *
		 * @param {Date} when the start of the ticker (could be now)
		 */
		const onCron = async (when = new Date()) => {
			const now = new Date();
			now.setMilliseconds(0);
			try {
				await cb({
					stat: {
						start: when,
						end: new Date(when.getTime() + duration * 60 * 1000),
						duration // minutes
					}, ...data
				});
			} catch (e) {
				this.error(`notifying on ${cron} gave an error: `, e);
			}
		};

		const cronParsed = cronParser.parseExpression(cron);

		if (duration > 0) {
			const prevCron = cronParsed.prev().toDate();
			const prevCronEnd = new Date(prevCron);
			prevCronEnd.setMinutes(prevCron.getMinutes() + duration);
			const isRunning = prevCronEnd > new Date();
			if (isRunning) {
				this.debug(`Initiating past cron for ${cron} (${cronstrue.toString(cron)}) about ${prevCronEnd} on ${new Date()} with duration ${duration}`);
				// TODO: manage currently running tickers
				onCron(prevCron);
			}
		}

		let tsId = 0;
		const program = () => {
			const next = new Date(cronParsed.next().toDate());
			const ds = next - new Date();
			tsId = setTimeout(() => {
				program();
				onCron();
			}, ds);
		};
		program();
		return () => clearTimeout(tsId);
	}

	/**
	 * Resolve a promise on a certain date
	 *
	 * @param {Date} date the date on which the promise will be resolved
	 * @returns {Promise<void>} a promise resolving on date
	 */
	async onDate(date) {
		return new Promise((resolve, _reject) => {
			if (typeof (date) == 'string') {
				date = new Date(date);
			}
			const now = new Date();
			if (date < now) {
				this.debug('onDate: but it was already in the past, triggering immediately');
				return resolve();
			}
			setTimeout(() => resolve(), date.getTime() - now.getTime());
		});
	}
}

/**
 * @param {string} name of the context of the application
 * @returns {ServerApp} the application
 */
export default function serverAppFactory(name) {
	return new ServerApp(name);
}
