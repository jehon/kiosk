
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

const listing = new WeakMap();

export default (namespace) => {
	if (listing.has(namespace)) {
		return listing.get(namespace);
	}
	return new Logger(namespace);
};

export function enableDebugForRegexp(regexp) {
	debugFactory.enable(regexp);
}

