
const { app } = require('electron');

// Common
const Bus                                  = require('../common/bus');
const contextualize                        = require('../common/contextualize');
const loggerFactory                        = require('./server-logger');
const Scheduler                            = require('./server-scheduler');
const getConfig                            = require('./server-config');
const { dispatchToBrowser }                = require('./core-browser');
const { rootDir }                          = require('./server-config');

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
		this.info('Registering app', this.getName(), this);
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
		this.info(`Registering credentials for ${username}@${url}: #${password.length} characters`);
		// TODO: here
		//
		// https://github.com/electron/electron/blob/master/docs/api/web-contents.md#event-login
		// https://stackoverflow.com/questions/38281113/how-do-i-use-the-login-event-in-electron-framework
		//
		app.on('login', (event, webContents, details, authInfo, callback) => {
			if (details.url.startsWith(url)) {
				this.info(`Auto fill in credentials for ${details}`);
				event.preventDefault();
				callback(username, password);
			}
		});
		// TODO: make an array of credentials, to allow unsubscribing ???
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
}
module.exports.ServerAPI = ServerAPI;

module.exports.testingConfigOverride = function testingConfigOverride(newConfig) {
	return getConfig.testingConfigOverride(newConfig);
};

module.exports.testingConfigRestore = function testingConfigRestore() {
	return getConfig.testingConfigRestore();
};
