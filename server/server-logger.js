
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

const loggersList = new Set();

class Logger {
	namespace = '';
	streams = {};

	constructor(namespace) {
		this.namespace = namespace.split('.').join(':');
		this.streams.debug = debugFactory(this.namespace);
		this.streams.log = debugFactory(this.namespace + '*');
	}

	extend(name) {
		return new Logger(this.namespace + ':' + name);
	}

	setNamespace(nm) {
		// TODO with dynamic debugjs, change it here too...
		this.namespace = nm;
		loggersList.add(nm);
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

const loggerMap = new WeakMap();
const loggerList = new Set();

export default (namespace) => {
	if (loggerMap.has(namespace)) {
		return loggerMap.get(namespace);
	}
	logger.debug('creating logger ' + namespace);
	loggerList.add(namespace);
	return new Logger(namespace);
};

export function enableDebugForRegexp(regexp) {
	debugFactory.enable(regexp);
}

export function getLoggerList() {
	return new Set(loggerList);
}