
// Common
const Bus                                  = require('../common/bus.js');
const contextualize                        = require('../common/contextualize.js');
const loggerFactory                        = require('./server-logger.js');
const Scheduler                            = require('./server-scheduler.js');
const getConfig                            = require('./server-config.js');
const { getExpressApp }                    = require('./server-webserver.js');
const dispatchToBrowser                    = require('./server-client-dispatch.js');
const { rootDir }                          = require('./server-config.js');


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

	dispatchToBrowser(eventName, msg) {
		return dispatchToBrowser(this.c(eventName), msg);
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
		return getExpressApp();
	}
}
module.exports.ServerAPI = ServerAPI;

module.exports.testingConfigOverride = function testingConfigOverride(newConfig) {
	return getConfig.testingConfigOverride(newConfig);
};

module.exports.testingConfigRestore = function testingConfigRestore() {
	return getConfig.testingConfigRestore();
};
