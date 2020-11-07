
import { ServerLogger } from './server-lib-logger.js';

import CronJob from 'cron'; // https://www.npmjs.com/package/cron
import cronstrue from 'cronstrue'; // https://www.npmjs.com/package/crontrue
import cronParser from 'cron-parser';

import contextualize from '../common/contextualize.js';
import getConfig from './server-lib-config.js';
import { dispatchToBrowser } from './server-lib-gui.js';
import _ from 'lodash';

export class ServerApp extends ServerLogger {
	name;
	ctxfn;

	constructor(name, loggerNamespace = '.server') {
		const ctxfn = contextualize(name);
		super(ctxfn(loggerNamespace));

		this.name = name;
		this.ctxfn = ctxfn;
	}

	/**
	 * Create a copy of the app to a restricted scope: logger is subclassed
	 *
	 * @param {string} subLoggerName of the sub logger
	 * @returns {ServerApp} the subclassed app
	 */
	extend(subLoggerName) {
		return new ServerApp(this.name, this.loggerNamespace + '.' + subLoggerName);
	}

	/**
	 * Dispatch a status to the browser
	 *
	 * @param {object} data as the new status
	 * @returns {ServerApp} this
	 */
	setState(data) {
		this.state = data;
		dispatchToBrowser(this.ctxfn('.status'), data);
		return this;
	}

	/**
	 * @returns {object} the state of the application
	 */
	getState() {
		return _.cloneDeep(this.state);
	}

	/**
	 * Get some config if it exists, return def otherwise
	 *
	 * @param {string} [opath] the path in the json
	 * @param {*} [def] - the default value if the key is not found
	 * @returns {object|any} the key or def(null) if it does not exists
	 */
	getConfig(opath = '.', def = null) {
		return getConfig(this.ctxfn(opath), def);
	}

	// registerCredentials(url, username, password) {
	// 	this.debug(`Registering credentials for ${username}@${url}: #${password.length} characters`);
	// 	registerCredentials(url, { username, password });
	// 	return this;
	// }

	/**
	 * @param {Function} cb callback
	 * @param {string} cron 5/6 stars ([secs] min hours dom month dow) (if empty, make nothing [usefull for testing])
	 * @param {number} duration in minutes
	 * @param {*} data to pass to the signal (will be completed)
	 * @returns {Function} stop to halt the cron
	 */
	cron(cb, cron, duration = 0, data = {}) {
		if (cron == '') {
			return () => { };
		}

		// TODO: add a weakref (but not supported as of 2020-10-23)

		if (cron.split(' ').length == 5) {
			// Add second's
			cron = '0 ' + cron;
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

		if (duration > 0) {
			const prevCron = cronParser.parseExpression(cron).prev();
			const prevCronEnd = prevCron.setMinutes(prevCron.getMinutes() + duration);
			const isRunning = prevCronEnd.toDate() > new Date();
			// console.log('*', cron, isRunning);
			if (isRunning) {
				this.debug(`Initiating past cron for ${cron} (${cronstrue.toString(cron)}) about ${prevCronEnd.toString()} on ${new Date()} with duration ${duration}`);
				// TODO: manage currently running tickers
				onCron(prevCronEnd.toDate());
			}
		}

		const job = new CronJob.CronJob(cron, onCron);
		job.start();
		return () => job.stop();
	}
}

/**
 * @param {string} name of the context of the application
 * @param {string|undefined} loggerNamespace - if specified, a sub logger is created
 * @returns {ServerApp} the application
 */
export default function serverAppFactory(name, loggerNamespace = undefined) {
	return new ServerApp(name, loggerNamespace);
}
