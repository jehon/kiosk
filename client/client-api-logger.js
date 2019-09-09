
import '../node_modules/debug/dist/debug.js';

export async function remoteLogger(name, category, ...data) {
	let jdata = JSON.stringify(data,
		(k, v) => (v instanceof HTMLElement || v instanceof Node) ? 'html-element' : v
	);

	axios.post('/core/client/logs', {
		ts: new Date(),
		name,
		category,
		data: jdata
	})
		.catch(function (error) {
			/* eslint-disable no-console */
			console.error('Error sending log to server: ', error);
		});
}

class RemoteLogger {
	name = '';
	#debug;

	constructor(name) {
		this.name = name;
		/* global debug */
		this.#debug = debug(name.split('.').join(':'));
	}

	async info(...data) {
		/* eslint-disable no-console */
		console.info('[INFO]', this.name, ':', ...data);
		await remoteLogger(this.name, 'info', ...data);
	}

	async error(...data) {
		/* eslint-disable no-console */
		console.error('[ERROR]', this.name, ':', ...data);
		await remoteLogger(this.name, 'error', ...data);
	}

	async debug(...data) {
		// TODO: use debug.js in the browser too...

		/* eslint-disable no-console */
		// console.debug('[DEBUG]', this.name, ':', ...data);
		this.#debug(...data);
		await remoteLogger(this.name, 'debug', ...data);
	}
}

export default (name) => new RemoteLogger(name);

const globalCatcher = new RemoteLogger('core:global');

window.addEventListener('error', (event) => {
	globalCatcher.error(event.message,
		event.filename ?
			event.filename + '#' + event.lineno + ':' + event.colno
			: ''
		, event.error);
});
