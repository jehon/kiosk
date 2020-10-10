
// Common
const contextualize = require('../common/contextualize');
const loggerFactory = require('./server-logger');
const Scheduler = require('./server-scheduler');
const getConfig = require('./server-config');
const { dispatchToBrowser, registerCredentials } = require('./server-launch-browser');
const { rootDir } = require('./server-config');
const webServer = require('./server-webserver.js');

const scheduler = new Scheduler();
const electron = require('electron');

module.exports = function serverAPIFactory(name) {
	return new ServerAPI(name);
};

module.exports.rootDir = rootDir;

class ServerAPI {
	constructor(name) {
		this.name = name;
		this.logger = loggerFactory(this.name + ':server');
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
		electron.ipcMain.handle(eventName, cb);
	}

	addSchedule(cb, cron, duration = 0, data = {}) {
		return scheduler.addCron(cb, cron, duration, data);
	}

	getChildLogger(name) {
		return this.logger.extend(name);
	}

	getExpressApp() {
		return webServer.getExpressApp();
	}
}
module.exports.ServerAPI = ServerAPI;

module.exports.testingConfigOverride = function testingConfigOverride(newConfig) {
	return getConfig.testingConfigOverride(newConfig);
};

module.exports.testingConfigRestore = function testingConfigRestore() {
	return getConfig.testingConfigRestore();
};
