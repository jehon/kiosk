
// Get loggers from server and apply them locally
// debug.enable(remoteModule.getEnabledDebugRegexp());

/**
 * @param name
 * @param category
 * @param {...any} data
 */
export async function remoteLogger(name, category, ...data) {
	// Send the logs to the server
	return remoteModule.fromRemote(name, category, data);
}

class RemoteLogger {
	namespace = '';
	// debug;
	/**
	 * @param {string} namespace - the name of the logger
	 */
	constructor(namespace) {
		this.namespace = namespace;
	}

	extend(name) {
		return new RemoteLogger(this.namespace + ':' + name);
	}

	async info(...data) {
		/* eslint-disable no-console */
		console.info(this.namespace, ':' , '[INFO]', ...data);
		// await remoteLogger(this.namespace, 'info', ...data);
	}

	async error(...data) {
		/* eslint-disable no-console */
		console.error(this.namespace, ':' , '[ERROR]', ...data);
		// await remoteLogger(this.namespace, 'error', ...data);
	}

	async debug(...data) {
		console.debug('[DEBUG]', this.namespace, ':', ...data);
		// await remoteLogger(this.namespace, 'debug', ...data);
	}
}

/**
 * @param {string} namespace - the name of the logger
 * @returns {RemoteLogger} the logger
 */
export default function remoteLoggerFactory(namespace)  {
	return new RemoteLogger(namespace);
}

const globalCatcher = new RemoteLogger('client:catch');
window.addEventListener('error', (event) => {
	globalCatcher.error(event.message,
		event.filename ?
			event.filename + '#' + event.lineno + ':' + event.colno
			: ''
		, event.error);
});
