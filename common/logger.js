
// TODO: https://www.npmjs.com/package/ansi-to-html

import _ from '../node_modules/lodash-es/lodash.js';
import debugFactory from 'debug';

const activeLevels = {};

function renderError(e) {
	const stack = (_.isArray(e.stack) ? e.stack.join('\n at ') : e.stack);
	return `${e.message}\n  at ${stack}`;
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
		this.namespace = nm;
		loggersList.add(nm);
	}

	enableDebug() {
		debugFactory.enable(this.namespace);
	}

	disableDebug() {
		debugFactory.disable(this.namespace);
	}

	// _generateHeader(level) {
	// 	const m = new Date();
	// 	const date = m.getFullYear() + '-' + ('0' + (m.getMonth() + 1)).slice(-2) + '-' + ('0' + m.getDate()).slice(-2)
	// 		+ ' '
	// 		+ ('0' + m.getHours()).slice(-2) + ':' + ('0' + m.getMinutes()).slice(-2) + ':' + ('0' + m.getSeconds()).slice(-2);
	// 	let msg = `${color(date, 'gray')}`;
	// 	msg += ` ${color(this.origin, this.origin == 'server' ? 'cyan' : 'magenta')}`;
	// 	msg += ` ${color(level.padEnd(5), 'blue')}`;
	// 	msg += ` [${color(this.moduleName, 'yellow')}]: `;
	// 	return msg;
	// }

	_generateMessage(...args) {
		return args.map(v =>
			(typeof(v) == 'object'
				? (v instanceof Error) ? renderError(v) : JSON.stringify(v)
				: v)
		).join(' ');
	}

	error(...args) {
		const level = 'ERROR';
		this.streams.log(`[${level}] ` + this._generateMessage(...args).red);
		return this;
	}

	info(...args) {
		const level = 'INFO';
		this.streams.log(`[${level}] ` + this._generateMessage(...args));
		return this;
	}

	debug(...args) {
		const level = 'DEBUG';
		this.streams.debug(`[${level}] ` + this._generateMessage(...args));
		return this;
	}
}

export default (namespace) => {
	return new Logger(namespace);
};

export function debugModule(moduleName) {
	activeLevels[moduleName] = true;
}
