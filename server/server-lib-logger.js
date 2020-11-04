
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
 * @typedef {object} LogMessage to send log messages to the server
 * @property {string} type is a hardcoded constant 'log'
 * @property {string} data.namespace of the remote logger
 * @property {string} data.level of the remote logger
 * @property {Array<*>} data.content the real message
 */


/**
 * Allow remote* to log on the server
 *
 * @param {LogMessage} message to be received
 */
export function loggerAsMessageListener(/** @type {LogMessage} */ message) {
	if (message.type != 'log') {
		// Hardcoded type for log
		return;
	}

	// TODO: handle namespace locally ?
	const namespace = message.namespace ?? 'test';
	let logger;
	if (loggerMap.has(namespace)) {
		logger = loggerMap.get(namespace);
	} else {
		logger = new ServerLogger(namespace);
	}
	switch (message.level) {
		case ServerLogger.LEVEL_ERROR:
			logger.error(...message.content);
			break;
		case ServerLogger.LEVEL_INFO:
			logger.info(...message.content);
			break;
		case ServerLogger.LEVEL_DEBUG:
			logger.debug(...message.content);
			break;
		default:
			break;
	}
}

export class LoggerSender {
	constructor(sendFunction, loggerNamespace = '') {
		this.sendFunction = sendFunction;
		this.proxy = (level, ...args) => sendFunction({
			loggerNamespace,
			level,
			content: args
		});
	}

	error(...content) {
		this.proxy(ServerLogger.LEVEL_ERROR, ...content);
	}

	info(...content) {
		this.proxy(ServerLogger.LEVEL_INFO, ...content);
	}

	debug(...content) {
		this.proxy(ServerLogger.LEVEL_DEBUG, ...content);
	}
}
