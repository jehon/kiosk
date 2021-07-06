
import { ClientApp } from './client-app.js';

const app = new ClientApp('core', { devMode: false });

/*
 * Catch all errors and send them to the backend
 */
const globalCatcher = new ClientApp('catch');
window.addEventListener('error', (event) => {
	globalCatcher.error(event.message,
		event.filename ?
			event.filename + '#' + event.lineno + ':' + event.colno
			: ''
		, event.error);
});

//
// Load other packages
//

/**
 * @param {string} name of the package
 */
async function loadPackage(name) {
	app.debug(`Loading ${name}`);
	import(`../packages/${name}/${name}-client.js`)
		.then(() => app.debug(`Loading ${name} done`),
			e => app.error(`Loading ${name} error`, e));
}

Promise.all([
	loadPackage('menu'),
	loadPackage('human'),

	loadPackage('camera'),
	loadPackage('clock'),
	// loadPackage('fire'),
	loadPackage('photo-frame')
]);
