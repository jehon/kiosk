
import '../node_modules/debug/dist/debug.js';

const remoteModule = require('electron').remote.require('./server/server-logger.js');

// Get loggers from server and apply them locally
debug.enable(remoteModule.getEnabledDebugRegexp());

export async function remoteLogger(name, category, ...data) {
	// Send the logs to the server
	return remoteModule.fromRemote(name, category, data);
}

class RemoteLogger {
	namespace = '';
	debug;

	constructor(namespace) {
		this.namespace = namespace;
		/* global debug */
		this.debug = debug(namespace.split('.').join(':'));
	}

	extend(name) {
		return new RemoteLogger(this.namespace + ':' + name);
	}

	async info(...data) {
		/* eslint-disable no-console */
		console.info(this.namespace, ':' , '[INFO]', ...data);
		await remoteLogger(this.namespace, 'info', ...data);
	}

	async error(...data) {
		/* eslint-disable no-console */
		console.error(this.namespace, ':' , '[ERROR]', ...data);
		await remoteLogger(this.namespace, 'error', ...data);
	}

	async debug(...data) {
		// console.debug('[DEBUG]', this.name, ':', ...data);
		this.debug(...data);
		await remoteLogger(this.namespace, 'debug', ...data);
	}
}

export default function remoteLoggerFactory(name)  { return new RemoteLogger(name); }

const globalCatcher = new RemoteLogger('core:client:global');
window.addEventListener('error', (event) => {
	globalCatcher.error(event.message,
		event.filename ?
			event.filename + '#' + event.lineno + ':' + event.colno
			: ''
		, event.error);
});
