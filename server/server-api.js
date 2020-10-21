
// Common
const contextualize = require('../common/contextualize');
const loggerFactory = require('./server-logger');
const getConfig = require('./server-config');
const { dispatchToBrowser, registerCredentials, registerFunction } = require('./server-electron');

// https://www.npmjs.com/package/cron
const CronJob = require('cron');
const cronstrue = require('cronstrue');

module.exports = function serverAPIFactory(name) {
	return new ServerAPI(name);
};

class ServerAPI {
	constructor(name, loggerScope = '') {
		this.name = name;
		this.logger = loggerFactory(this.name + ( loggerScope ? ':' + loggerScope : '') + ':server');
		this.c = contextualize(this.name);
		this.debug('Registering app', this.getName(), this);
	}

	getName() {
		return this.name;
	}

	/**
	 *
	 * @param  {...any} data - what to print
	 * @returns {ServerAPI} this
	 */
	error(...data) {
		this.logger.error(...data);
		return this;
	}

	/**
	 *
	 * @param  {...any} data - what to print
	 * @returns {ServerAPI} this
	 */
	info(...data) {
		this.logger.info(...data);
		return this;
	}

	/**
	 *
	 * @param  {...any} data - what to print
	 * @returns {ServerAPI} this
	 */
	debug(...data) {
		this.logger.debug(...data);
		return this;
	}

	/**
	 * Enable the debug stream
	 *
	 * @returns {ServerAPI} this
	 */
	enableDebug() {
		this.logger.enableDebug();
		return this;
	}

	/**
	 * Get some config if it exists, return def otherwise
	 *
	 * @param {string} [opath] the path in the json
	 * @param {*} [def] - the default value if the key is not found
	 * @returns {object|any} the key or def(null) if it does not exists
	 */
	getConfig(opath, def = null) {
		if (opath) {
			return getConfig(this.c(opath), def);
		}
		return getConfig();
	}

	registerCredentials(url, username, password) {
		this.debug(`Registering credentials for ${username}@${url}: #${password.length} characters`);
		registerCredentials(url, { username, password });

		// TODO: here - split the registerCredentials -> map + onlogin being on different logger and thread
		//
		// https://github.com/electron/electron/blob/master/docs/api/web-contents.md#event-login
		// https://stackoverflow.com/questions/38281113/how-do-i-use-the-login-event-in-electron-framework
		//

		// electronApp.on('login', (event, webContents, details, authInfo, callback) => {
		// 	this.debug(`login request for ${details.url}`);
		// 	if (details.url.startsWith(url)) {
		// 		this.debug(`Auto fill in credentials of ${details.url} for ${url} with ${username}`);
		// 		event.preventDefault();
		// 		callback(username, password);
		// 	}
		// });
		return this;
	}

	dispatchToBrowser(eventName) {
		return dispatchToBrowser(this.c(eventName));
	}

	handleBrowser(eventName, cb) {
		registerFunction(eventName, cb);
	}

	/**
	 * @param {Function} cb callback
	 * @param {string} cron 5/6 stars ([secs] min hours dom month dow) (if empty, make nothing [usefull for testing])
	 * @param {number} duration in minutes
	 * @param {*} data to pass to the signal (will be completed)
	 * @returns {Function} stop to halt the cron
	 */
	addSchedule(cb, cron, duration = 0, data = {}) {
		if (cron == '') {
			return () => { };
		}

		this.debug(`Programming event: ${cronstrue.toString(cron)}`);

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

	extend(subLoggerName) {
		return new ServerAPI(this.name, subLoggerName);
	}
}
module.exports.ServerAPI = ServerAPI;

module.exports.testingConfigOverride = function testingConfigOverride(newConfig) {
	return getConfig.testingConfigOverride(newConfig);
};

module.exports.testingConfigRestore = function testingConfigRestore() {
	return getConfig.testingConfigRestore();
};
