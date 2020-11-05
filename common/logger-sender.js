
/**
 * @typedef {object} LogMessage to send log messages to the server
 * @property {string} type is a hardcoded constant 'log'
 * @property {object} data with additional data
 * @property {string} data.namespace of the remote logger
 * @property {string} data.level of the remote logger
 * @property {Array<*>} data.content the real message
 */

export class LoggerSender {
	static CHANNEL_NAME = 'log'
	static MESSAGE_TYPE = 'log'
	static LEVEL_ERROR = 'error'
	static LEVEL_INFO = 'info'
	static LEVEL_DEBUG = 'debug'

	constructor(sendFunction, loggerNamespace = '') {
		this.loggerNamespace = loggerNamespace;
		this.proxy = (level, ...args) => {
			sendFunction({
				namespace: loggerCanonizeNamespace(loggerNamespace),
				level,
				content: args.map(e => (e instanceof Object ? JSON.stringify(e) : e))
			});
		};
	}

	error(...content) {
		this.proxy(LoggerSender.LEVEL_ERROR, ...content);
	}

	info(...content) {
		this.proxy(LoggerSender.LEVEL_INFO, ...content);
	}

	debug(...content) {
		this.proxy(LoggerSender.LEVEL_DEBUG, ...content);
	}
}

/**
 * @param {string} n - non normalized namespace
 * @returns {string} the normalized namespace
 */
export function loggerCanonizeNamespace(n) {
	if (!n.startsWith('kiosk')) {
		n = 'kiosk.' + n;
	}
	return n.split('.').join(':').replace(/:+/g, ':');
}
