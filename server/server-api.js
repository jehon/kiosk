
// const esmLoader = require('esm')(module/*, options*/);

// Common
const Bus                                  = require('../common/bus.mjs');
const contextualize                        = require('../common/contextualize.mjs');
const loggerFactory                        = require('./server-logger.js');
const Scheduler                            = require('./server-scheduler.js');
const configAPI                            = require('./server-config.js');
const { getExpressApp }                    = require('./server-webserver.js');
const dispatchToBrowser                    = require('./server-client-dispatch.js');

const bus       = new Bus(loggerFactory('core:server:bus'));
const scheduler = new Scheduler(bus);

function getSavedState() {
	return bus.getSavedState();
}

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
			return configAPI.getConfig(this.c(opath), def);
		}
		return configAPI.getConfig();
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

function serverAPIFactory(name) {
	return new ServerAPI(name);
}

function testingConfigOverride(newConfig) {
	return configAPI.testingConfigOverride(newConfig);
}

function testingConfigRestore() {
	return configAPI.testingConfigRestore();
}

module.exports = serverAPIFactory;
module.exports.rootDir = configAPI.rootDir;
module.exports.getSavedState = getSavedState;
module.exports.ServerAPI = ServerAPI;
module.exports.testingConfigOverride = testingConfigOverride;
module.exports.testingConfigRestore = testingConfigRestore;
