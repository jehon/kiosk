
// Colors for the process logger
require('colors');

const _ = require('lodash');
const debugFactory = require('debug');

/**
 * @param e
 */
function renderError(e) {
	const stack = (_.isArray(e.stack) ? e.stack.join('\n at ') : e.stack);
	return `${e.message}\n  at ${stack}`;
}

/**
 * @param level
 * @param {...any} args
 */
function generateMessage(level, ...args) {
	return `[${level}] ` + args.map(v =>
		(typeof (v) == 'object'
			? (v instanceof Error) ? renderError(v) : JSON.stringify(v)
			: v)
	).join(' ');
}

/**
 * @param {string} n - non normalized namespace
 * @returns {string} the normalized namespace
 */
function canonizeNamespace(n) {
	if (!n.startsWith('kiosk')) {
		n = 'kiosk:' + n;
	}
	return n.split('.').join(':');
}

const loggersMap = new WeakMap();
const loggersList = new Map();

class Logger {
	namespace = '';
	streams = {};

	constructor(namespace) {
		this.namespace = canonizeNamespace(namespace);

		this.streams.debug = debugFactory(this.namespace);
		this.streams.log = debugFactory(this.namespace + '*');

		// Register for later use
		loggersList.set(this.namespace, { k: this.namespace });
		loggersMap.set(loggersList.get(this.namespace), this);
	}

	extend(name) {
		return new Logger(this.namespace + ':' + name);
	}

	error(...args) {
		this.streams.log(generateMessage('ERROR', ...args).red);
		return this;
	}

	info(...args) {
		this.streams.log(generateMessage('INFO', ...args));
		return this;
	}

	debug(...args) {
		this.streams.debug(generateMessage('DEBUG', ...args));
		return this;
	}
}

const logger = new Logger('server:logger');
logger.info('To have the list of available loggers, enable this one');

/**
 * Create a logger in the given namespace
 *
 * @param {string} rawNamespace - the namespace in which this will live (should not start with kiosk:)
 * @returns {Logger} a logger
 */
function loggerFactory(rawNamespace) {
	const namespace = canonizeNamespace(rawNamespace);

	if (loggersList.has(namespace)) {
		const k = loggersList.get(namespace);
		if (loggersMap.has(k)) {
			return loggersMap.get(k);
		}
	}
	logger.debug('creating logger ' + namespace);
	return new Logger(namespace);
}
module.exports = loggerFactory;

let enabled = process.env.DEBUG;
module.exports.enableDebugForRegexp = function enableDebugForRegexp(regexp) {
	// Protect agains DEBUG not being defined
	enabled = (enabled ? enabled + ',' : '') + regexp;
	debugFactory.enable(enabled);
};

module.exports.getEnabledDebugRegexp = function getEnabledDebugRegexp() {
	return enabled;
};

module.exports.getLoggerList = function getLoggerList() {
	return Array.from(loggersList.keys());
};

module.exports.fromRemote = function (name, category, data) {
	if (!['error', 'info', 'debug'].includes(category)) {
		throw 'Invalid category';
	}

	// Make the call to the right logger
	loggerFactory(name + ':client')[category](name, ...data);
};
