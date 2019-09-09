
// TODO: use https://www.npmjs.com/package/debug (but not esm ready)
// TODO: activate logger levels global and by modules from ENV variable or cmd line -> see "debug" package when ready

import _ from '../node_modules/lodash-es/lodash.js';
import debugFactory from '../node_modules/debug/dist/debug.js';

const activeLevels = {};

function color(str, color) {
	if (str[color]) {
		return str[color];
	}
	return str;
}

function renderError(e) {
	const stack = (_.isArray(e.stack) ? e.stack.join('\n at ') : e.stack);
	return `${e.message}\n  at ${stack}`;
}

class Logger {
	moduleName = '';
	origin = '';

	constructor(moduleName = '?', origin = 'server') {
		this.moduleName = moduleName;
		this.origin = origin;
		this.debug = debugFactory(moduleName);
	}

	enableDebug() {
		debugFactory.enable(this.moduleName);
	}

	disableDebug() {
		debugFactory.disable(this.moduleName);
	}

	_generateHeader(level) {
		const m = new Date();
		const date = m.getFullYear() + '-' + ('0' + (m.getMonth() + 1)).slice(-2) + '-' + ('0' + m.getDate()).slice(-2)
			+ ' '
			+ ('0' + m.getHours()).slice(-2) + ':' + ('0' + m.getMinutes()).slice(-2) + ':' + ('0' + m.getSeconds()).slice(-2);
		let msg = `${color(date, 'gray')}`;
		msg += ` ${color(this.origin, this.origin == 'server' ? 'cyan' : 'magenta')}`;
		msg += ` ${color(level.padEnd(5), 'blue')}`;
		msg += ` [${color(this.moduleName, 'yellow')}]: `;
		return msg;
	}

	_generateMessage(...args) {
		return args.map(v =>
			(typeof(v) == 'object'
				? (v instanceof Error) ? renderError(v) : JSON.stringify(v)
				: v)
		).join(' ');
	}

	error(...args) {
		const level = 'ERROR';
		/* eslint-disable-next-line no-console */
		console.error(this._generateHeader(level), color(this._generateMessage(...args), 'red'));
		return this;
	}

	info(...args) {
		const level = 'INFO';
		/* eslint-disable-next-line no-console */
		console.info(this._generateHeader(level), color(this._generateMessage(...args), 'white'));
		return this;
	}

	debug(...args) {
		const level = 'DEBUG';
		this.debug(this._generateHeader(level), color(this._generateMessage(...args), 'yellow'));
		return this;
	}
}

export default (moduleName = '', origin = 'server') => new Logger(moduleName, origin);

export function debugModule(moduleName) {
	activeLevels[moduleName] = true;
}
