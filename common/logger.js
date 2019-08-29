
// TODO: use https://www.npmjs.com/package/debug (but not esm ready)
// TODO: activate logger levels global and by modules from ENV variable or cmd line -> see "debug" package when ready

import _ from '../node_modules/lodash-es/lodash.js';

function color(str, color) {
	if (str[color]) {
		return str[color];
	}
	return str;
}

const LEVELS = {
	'ERROR': 1,
	'INFO': 4,
	'DEBUG': 5
};

const activeLevels = {
	'*':5
};

function level2Int(level) {
	return LEVELS[level];
}

function renderError(e) {
	const stack = (_.isArray(e.stack) ? e.stack.join('\n at ') : e.stack);
	return `${e.message}\n  at ${stack}`;
}

class Logger {
	constructor(moduleName = '?') {
		this.moduleName = moduleName;
	}

	setModuleLevel(level) {
		return setModuleLevel(this.moduleName, level);
	}

	_isActive(level) {
		if (this.moduleName in activeLevels) {
			return activeLevels[this.moduleName] >= level2Int(level);
		}
		return activeLevels['*'] >= level2Int(level);
	}

	_generateHeader(level) {
		const m = new Date();
		const date = m.getFullYear() + '-' + ('0' + (m.getMonth() + 1)).slice(-2) + '-' + ('0' + m.getDate()).slice(-2)
			+ ' '
			+ ('0' + m.getHours()).slice(-2) + ':' + ('0' + m.getMinutes()).slice(-2) + ':' + ('0' + m.getSeconds()).slice(-2);
		return `${color(date, 'gray')} ${color(level.padEnd(7), 'blue')} [${color(this.moduleName, 'yellow')}]: `;
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
		if (this._isActive(level)) {
			/* eslint-disable-next-line no-console */
			console.error(this._generateHeader(level), color(this._generateMessage(...args), 'red'));
		}
		return this;
	}

	info(...args) {
		const level = 'INFO';
		if (this._isActive(level)) {
			/* eslint-disable-next-line no-console */
			console.info(this._generateHeader(level), color(this._generateMessage(...args), 'white'));
		}
		return this;
	}

	debug(...args) {
		const level = 'DEBUG';
		if (this._isActive(level)) {
			/* eslint-disable-next-line no-console */
			console.debug(this._generateHeader(level), color(this._generateMessage(...args), 'yellow'));
		}
		return this;
	}
}

export default (moduleName = '') => new Logger(moduleName);

export function setGlobalLevel(level) {
	activeLevels['*'] = level2Int(level);
}

export function setModuleLevel(moduleName, level) {
	activeLevels[moduleName] = level2Int(level);
}
if (typeof(window) != 'undefined') {
	window.setModuleLevel = setModuleLevel;
}
