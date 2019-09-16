
import '../node_modules/debug/dist/debug.js';

// TODO: get loggers from server and apply them locally

// core.loggersRegexp

export async function remoteLogger(name, category, ...data) {
	let jdata = JSON.stringify(data,
		(k, v) => (v instanceof HTMLElement || v instanceof Node) ?
			(
				'html-element'
				+ (v.id ? '#' + v.id : '')
				+ (v.class ? '.' + v.class : '')
			)
			: v
	);

	axios.post('/core/client/logs', {
		ts: new Date(),
		name,
		category,
		data: jdata
	})
		.catch(function (_error) {
			/* eslint-disable no-console */
			// console.error('Error sending log to server: ', _error);
		});
}

class RemoteLogger {
	name = '';
	debug;

	constructor(name) {
		this.name = name;
		/* global debug */
		this.debug = debug(name.split('.').join(':'));
	}

	async info(...data) {
		/* eslint-disable no-console */
		console.info(this.name, ':' , '[INFO]', ...data);
		await remoteLogger(this.name, 'info', ...data);
	}

	async error(...data) {
		/* eslint-disable no-console */
		console.error(this.name, ':' , '[ERROR]', ...data);
		await remoteLogger(this.name, 'error', ...data);
	}

	async debug(...data) {
		// console.debug('[DEBUG]', this.name, ':', ...data);
		this.debug(...data);
		await remoteLogger(this.name, 'debug', ...data);
	}
}

export default (name) => new RemoteLogger(name);

const globalCatcher = new RemoteLogger('core:client:global');
window.addEventListener('error', (event) => {
	globalCatcher.error(event.message,
		event.filename ?
			event.filename + '#' + event.lineno + ':' + event.colno
			: ''
		, event.error);
});

export function enableClientLoggers(loggers) {
	console.info('Loggers to be enabled', loggers);
	// Do not debug unless explicitely said to
	debug.disable('*');

	// Enable what we want
	debug.enable(loggers);
}
