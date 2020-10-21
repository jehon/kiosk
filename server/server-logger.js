
// Colors for the process logger

require('colors');

const _ = require('lodash');
const debugFactory = require('debug');

/**
 * @param {Error} e - the reror to be rendered
 * @returns {string} the error in a string presentation
 */
function renderError(e) {
	const stack = (_.isArray(e.stack) ? e.stack.join('\n at ') : e.stack);
	return `${e.message}\n  at ${stack}`;
}

/**
 * @param {string} level - the level to be shown in the debug
 * @param {...any} args - anything to print
 * @returns {string} the message formatted for display
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

	/**
	 * Create a logger for a given namespace
	 *
	 * @param {*} namespace - the namespace (dot separated if sub namespace is used)
	 */
	constructor(namespace) {
		this.namespace = canonizeNamespace(namespace);

		this.streams.debug = debugFactory(this.namespace);
		this.streams.log = debugFactory(this.namespace + '*');

		// Register for later use
		loggersList.set(this.namespace, { k: this.namespace });
		loggersMap.set(loggersList.get(this.namespace), this);
	}

	/**
	 * Create a sub logger
	 *
	 * @param {*} name - name of the sub logger
	 * @returns {Logger} - the new logger
	 */
	extend(name) {
		return new Logger(this.namespace + ':' + name);
	}

	/**
	 * Log flow always enabled and displayed in red
	 *
	 * @param  {...any} args - things to display
	 * @returns {Logger} this
	 */
	error(...args) {
		this.streams.log(generateMessage('ERROR', ...args).red);
		return this;
	}

	/**
	 * Log flow always enabled
	 *
	 * @param  {...any} args - things to display
	 * @returns {Logger} this
	 */
	info(...args) {
		this.streams.log(generateMessage('INFO', ...args));
		return this;
	}

	/**
	 * Log enabled by debug facility
	 *
	 * @param  {...any} args - things to display
	 * @returns {Logger} this
	 */
	debug(...args) {
		this.streams.debug(generateMessage('DEBUG', ...args));
		return this;
	}

	/**
	 * @returns {boolean} true if debug is enabled (and displayed)
	 */
	isDebugEnabled() {
		return this.streams.debug.enabled;
	}

	/**
	 * Enable the debug stream
	 *
	 * @param {boolean} [enable] - whether to enable or not
	 * @returns {Logger} this
	 */
	enableDebug(enable = true) {
		this.streams.debug.enabled = enable;
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

module.exports.Logger = Logger;

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
