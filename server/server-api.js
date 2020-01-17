
const { app: electronApp } = require('electron');

// Common
const Bus                                        = require('../common/bus');
const contextualize                              = require('../common/contextualize');
const loggerFactory                              = require('./server-logger');
const Scheduler                                  = require('./server-scheduler');
const getConfig                                  = require('./server-config');
const { dispatchToBrowser, registerCredentials } = require('./core-browser');
const { rootDir }                                = require('./server-config');
const webServer                                  = require('./server-webserver.js');

const bus       = new Bus(loggerFactory('core:server:bus'));
const scheduler = new Scheduler(bus);

module.exports = function serverAPIFactory(name) {
	return new ServerAPI(name);
};

module.exports.rootDir = rootDir;
module.exports.getSavedState = function getSavedState() {
	return bus.getSavedState();
};

class ServerAPI {
	constructor(name) {
		this.name = name;
		this.logger = loggerFactory(this.name);
		this.c = contextualize(this.name);
		this.debug('Registering app', this.getName(), this);
	}

	getName() {
		return this.name;
	}

	error(...data) {
		this.logger.error(...data);
	}

	info(...data) {
		this.logger.info(...data);
	}

	debug(...data) {
		this.logger.debug(...data);
	}

	getConfig(opath, def)  {
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
	}

	dispatchToBrowser(eventName) {
		return dispatchToBrowser(this.c(eventName));
	}

	dispatch(eventName, msg) {
		return bus.dispatch(this.c(eventName), msg);
	}

	subscribe(eventName, cb) {
		return bus.subscribe(this.c(eventName), cb);
	}

	addSchedule(signal, cron, duration = 0, data = {}) {
		return scheduler.addCron(this.c(signal), cron, duration , data);
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
