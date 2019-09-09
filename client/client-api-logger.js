
export async function remoteLogger(name, category, ...data) {
	axios.post('/core/client/logs', {
		ts: new Date(),
		name,
		category,
		data: data.map(v => v instanceof HTMLElement || v instanceof Node ? 'html-element' : v),
	})
		.catch(function (error) {
			/* eslint-disable no-console */
			console.log('Error sending log to server: ', error);
		});
}

class RemoteLogger {
	name = '';

	constructor(name) {
		this.name = name;
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
		console.debug('[DEBUG]', this.name, ':', ...data);
		await remoteLogger(this.name, 'debug', ...data);
	}
}

export default (name) => new RemoteLogger(name);
