
// import debugFactory from '../node_modules/debug/src/browser.js';

import { LoggerSender } from '../common/logger-sender.js';
const { ipcRenderer } = require('electron');

// Get loggers from server and apply them locally
// debug.enable(remoteModule.getEnabledDebugRegexp());

class ClientLogger extends LoggerSender {
	/**
	 * @param {string} namespace - the name of the logger
	 */
	constructor(namespace) {
		super((data) => ipcRenderer.send(LoggerSender.CHANNEL_NAME, data), namespace + ':client');
	}

	info(...data) {
		/* eslint-disable no-console */
		console.info(this.loggerNamespace, ':', '[INFO]', ...data);
		super.info(...data);
	}

	error(...data) {
		/* eslint-disable no-console */
		console.error(this.loggerNamespace, ':', '[ERROR]', ...data);
		super.error(...data);
	}

	debug(...data) {
		console.debug(this.loggerNamespace, ':', '[DEBUG]', ...data);
		super.debug(...data);
	}
}

/**
 * @param {string} namespace - the name of the logger
 * @returns {ClientLogger} the logger
 */
export default function clientLoggerFactory(namespace) {
	return new ClientLogger(namespace);
}
