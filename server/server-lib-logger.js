
import _ from 'lodash';
import debugFactory from 'debug';
import chalk from 'chalk';

const loggersCreationStream = debugFactory('kiosk:loggers');

/**
 * For dynamic loggers
 */
const loggerMap = new Map();

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
 * @param {Error} e - the error to be rendered
 * @returns {string} the error in a string presentation
 */
function loggerRenderError(e) {
	//const stack = (_.isArray(e.stack) ? e.stack.join('\n at ') : e.stack);
	const stack = e.stack;
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

export class ServerLogger {
	static LEVEL_ERROR = 'error'
	static LEVEL_INFO = 'info'
	static LEVEL_DEBUG = 'debug'

	streams = {
		debug: (..._args) => { },
		log: (..._args) => { }
	}

	constructor(loggerNamespace) {
		this.loggerNamespace = loggerNamespace;
		const loggerNamespaceCanonized = loggerCanonizeNamespace(loggerNamespace);
		this.streams.debug = debugFactory(loggerNamespaceCanonized);
		this.streams.log = debugFactory(loggerNamespaceCanonized + '*');
		loggersCreationStream(`Creating logger '${loggerNamespaceCanonized}'`);

		// Store in cache for dynamic logger
		loggerMap.set(loggerNamespaceCanonized, this);
	}

	/**
	 * Log an error
	 *
	 * @param  {...any} data - what to print
	 * @returns {ServerLogger} this
	 */
	error(...data) {
		this.streams.log(chalk.red(loggerGenerateMessage('ERROR', ...data)));
		return this;
	}

	/**
	 * Log an info
	 *
	 * @param  {...any} data - what to print
	 * @returns {ServerLogger} this
	 */
	info(...data) {
		this.streams.log(loggerGenerateMessage('INFO', ...data));
		return this;
	}

	/**
	 * Log a debug message
	 *
	 * @param  {...any} data - what to print
	 * @returns {ServerLogger} this
	 */
	debug(...data) {
		this.streams.debug(loggerGenerateMessage('DEBUG', ...data));
		return this;
	}

	/**
	 * Enable the debug stream
	 *
	 * @param {boolean} enable to be enabled
	 * @returns {ServerLogger} this
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
}

/**
 * Allow remote* to log on the server
 *
 * @param {object} data recevied from channel
 * @member {string} namespace of the remote logger
 * @member {string} level of the remote logger
 * @member {Array<any>} message of the remote logger
 */
export function remoteLogger(data) {
	const namespace = data.namespace;
	let logger;
	if (loggerMap.has(namespace)) {
		logger = loggerMap.get(namespace);
	} else {
		logger = new ServerLogger(namespace);
	}
	switch (data.level) {
		case ServerLogger.LEVEL_ERROR:
			logger.error(...data.message);
			break;
		case ServerLogger.LEVEL_INFO:
			logger.info(...data.message);
			break;
		case ServerLogger.LEVEL_DEBUG:
			logger.this.debug(...data.message);
			break;
		default:
			break;
	}
}
