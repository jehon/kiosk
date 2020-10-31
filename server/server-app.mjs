
import chalk from 'chalk';
import _ from 'lodash';
import debugFactory from 'debug';
import CronJob from 'cron'; // https://www.npmjs.com/package/cron
import cronstrue from 'cronstrue'; // https://www.npmjs.com/package/cron

import contextualize from '../common/contextualize.mjs';
import getConfig from './server-lib-config.mjs';
import { dispatchToBrowser } from './server-lib-gui.mjs';

const loggersCreationStream = debugFactory('kiosk:loggers');

/**
 * @param {string} n - non normalized namespace
 * @returns {string} the normalized namespace
 */
function loggerCanonizeNamespace(n) {
	if (!n.startsWith('kiosk')) {
		n = 'kiosk.' + n;
	}
	return n.split('.').join(':').replace(/:+/g, ':');
}

/**
 * @param {Error} e - the reror to be rendered
 * @returns {string} the error in a string presentation
 */
function loggerRenderError(e) {
	const stack = (_.isArray(e.stack) ? e.stack.join('\n at ') : e.stack);
	return `${e.message}\n  at ${stack}`;
}

/**
 * @param {string} level - the level to be shown in the debug
 * @param {...any} args - anything to print
 * @returns {string} the message formatted for display
 */
function loggerGenerateMessage(level, ...args) {
	return `[${level}] ` + args.map(v =>
		(typeof (v) == 'object'
			? (v instanceof Error) ? loggerRenderError(v) : JSON.stringify(v)
			: v)
	).join(' ');
}

export class ServerApp {
	name = '';
	ctxfn = (_c) => { };
	streams = {
		debug: (..._args) => { },
		log: (..._args) => { }
	}

	constructor(name, loggerNamespace = '.server') {
		this.name = name;
		this.loggerNamespace = loggerNamespace;
		this.ctxfn = contextualize(this.name);

		const loggerNamespaceCanonized = loggerCanonizeNamespace(this.ctxfn(loggerNamespace));
		this.streams.debug = debugFactory(loggerNamespaceCanonized);
		this.streams.log = debugFactory(loggerNamespaceCanonized + '*');
		loggersCreationStream('Creating logger ' + loggerNamespaceCanonized);
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
		return this.state;
	}

	/**
	 * Log an error
	 *
	 * @param  {...any} data - what to print
	 * @returns {ServerApp} this
	 */
	error(...data) {
		this.streams.log(chalk.red(loggerGenerateMessage('ERROR', ...data)));
		return this;
	}

	/**
	 * Log an info
	 *
	 * @param  {...any} data - what to print
	 * @returns {ServerApp} this
	 */
	info(...data) {
		this.streams.log(loggerGenerateMessage('INFO', ...data));
		return this;
	}

	/**
	 * Log a debug message
	 *
	 * @param  {...any} data - what to print
	 * @returns {ServerApp} this
	 */
	debug(...data) {
		this.streams.debug(loggerGenerateMessage('DEBUG', ...data));
		return this;
	}

	/**
	 * Enable the debug stream
	 *
	 * @param {boolean} enable to be enabled
	 * @returns {ServerApp} this
	 */
	enableDebug(enable = true) {
		this.streams.debug.enabled = enable;
		return this;
	}

	/**
	 * @returns {boolean} true if debug is enabled (and displayed)
	 */
	isDebugEnabled() {
		return this.streams.debug.enabled;
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

	// 	// TODO: here - split the registerCredentials -> map + onlogin being on different logger and thread
	// 	//
	// 	// https://github.com/electron/electron/blob/master/docs/api/web-contents.md#event-login
	// 	// https://stackoverflow.com/questions/38281113/how-do-i-use-the-login-event-in-electron-framework
	// 	//

	// 	// electronApp.on('login', (event, webContents, details, authInfo, callback) => {
	// 	// 	this.debug(`login request for ${details.url}`);
	// 	// 	if (details.url.startsWith(url)) {
	// 	// 		this.debug(`Auto fill in credentials of ${details.url} for ${url} with ${username}`);
	// 	// 		event.preventDefault();
	// 	// 		callback(username, password);
	// 	// 	}
	// 	// });
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

		const job = new CronJob.CronJob(cron, async () => {
			const now = new Date();
			now.setMilliseconds(0);
			try {
				await cb({
					stat: {
						start: now,
						end: new Date(now.getTime() + duration * 60 * 1000),
						duration // minutes
					}, ...data
				});
			} catch (e) {
				this.error('notifying ${eventName} gave an error: ', e);
			}
		});
		job.start();
		return () => job.stop();
	}
}

/**
 * @param {string} name of the context of the application
 * @param {string|undefined} loggerNamespace - if specified, a sub logger is created
 * @returns {ServerApp} the application
 */
export default function serverAppFactory(name, loggerNamespace) {
	return new ServerApp(name, loggerNamespace);
}
