
// Colors for the process logger
import '../node_modules/colors/lib/index.js';

import _ from '../node_modules/lodash-es/lodash.js';
import debugFactory from 'debug';

function renderError(e) {
	const stack = (_.isArray(e.stack) ? e.stack.join('\n at ') : e.stack);
	return `${e.message}\n  at ${stack}`;
}

function generateMessage(level, ...args) {
	return `[${level}] ` + args.map(v =>
		(typeof(v) == 'object'
			? (v instanceof Error) ? renderError(v) : JSON.stringify(v)
			: v)
	).join(' ');
}

function canonizeNamespace(n) {
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

	enableDebug() {
		debugFactory.enable(this.namespace);
	}

	disableDebug() {
		debugFactory.disable(this.namespace);
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

const logger = new Logger('core:server:logger');
logger.info('To have the list of available lgogers, enable this one');

export default (rawNamespace) => {
	const namespace = canonizeNamespace(rawNamespace);

	if (loggersList.has(namespace)) {
		const k = loggersList.get(namespace);
		if (loggersMap.has(k)) {
			return loggersMap.get(k);
		}
	}
	logger.debug('creating logger ' + namespace);
	return new Logger(namespace);
};

let enabled = process.env.DEBUG;
export function enableDebugForRegexp(regexp) {
	enabled = [ enabled, regexp ].join(',');
	debugFactory.enable(enabled);
}

export function getLoggerList() {
	return new Set(loggersList.keys());
}
