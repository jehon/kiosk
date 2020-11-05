
import _ from 'lodash';
import debugFactory from 'debug';
import chalk from 'chalk';

import { LoggerSender, loggerCanonizeNamespace } from '../common/logger-sender.js';

const loggersCreationStream = debugFactory('kiosk:loggers');

/**
 * For dynamic loggers
 */
const loggerMap = new Map();

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
	streams = {
		debug: (..._args) => { },
		log: (..._args) => { }
	}

	constructor(loggerNamespace) {
		this.loggerNamespace = loggerCanonizeNamespace(loggerNamespace);
		this.streams.debug = debugFactory(this.loggerNamespace);
		this.streams.log = debugFactory(this.loggerNamespace + '*');
		loggersCreationStream(`Creating logger '${this.loggerNamespace}'`);

		// Store in cache for dynamic logger
		loggerMap.set(this.loggerNamespace, this);
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
 * @param {LogMessage} message to be received
 */
export function loggerAsMessageListener(message) {
	// TODO: handle namespace locally ?
	const namespace = message.namespace ?? 'test';
	let logger;
	if (loggerMap.has(namespace)) {
		logger = loggerMap.get(namespace);
	} else {
		logger = new ServerLogger(namespace);
	}
	switch (message.level) {
		case LoggerSender.LEVEL_ERROR:
			logger.error(...message.content);
			break;
		case LoggerSender.LEVEL_INFO:
			logger.info(...message.content);
			break;
		case LoggerSender.LEVEL_DEBUG:
			logger.debug(...message.content);
			break;
		default:
			break;
	}
}
