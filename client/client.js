
import clientAPIFactory from './client-api.js';
import { enableClientLoggers } from './client-logger.js';
import './client-server-events.js';

const app = clientAPIFactory('core:client');

/* global toastr */
/* configure the toastr */
toastr.options.timeOut = 10*1000;

//
// Main initialization of gui
//

const mainAppElement = document.querySelector('#main-application');
if (mainAppElement == null) {
	throw 'registerMainContainer: #main-application is null';
}

let displayedApplication = false;

app.subscribe('apps.current', (wishedApp) => {
	//
	// Main app
	//

	// Skip if
	// - we don't have a new application (currentMainApplication)
	// - we are already there (currentMainApplication == displayedApplication)
	if (wishedApp != null && (wishedApp.id != displayedApplication.id)) {
		// Reject not "main" application
		if (!('mainElement' in wishedApp)) {
			app.error(`No mainElement in ${wishedApp.getName()}`);
			mainAppElement.innerHTML = `<div>No main element available for app ${this.getName()}: ${JSON.stringify(this)}</div>`;
		} else {
			// Ok, let's go !
			app.info(`Selecting ${wishedApp.getName()}`);
			displayedApplication = wishedApp;

			mainAppElement.innerHTML = '';
			const me = wishedApp.mainElement;
			if (typeof(me) == 'function') {
				me(mainAppElement);
			} else {
				mainAppElement.appendChild(me);
			}
		}
	}
});

// For development mainly (and only)
let startedTimestamp = false;
app.subscribe('core.started', (data) => {
	let startedTimestampNew = data.startupTime.toISOString();
	app.debug('Connected back to the server: ', startedTimestampNew, startedTimestamp);
	if (startedTimestamp) {
		if (startedTimestampNew != startedTimestamp) {
			app.info('New session from server: ', startedTimestampNew, 'restarting the browser');
			document.location.reload();
		}
	}
	startedTimestamp = startedTimestampNew;
});

app.subscribe('core.loggersRegexp', (loggers) => {
	enableClientLoggers(loggers);
});

//
// Load other packages
//

fetch('/core/packages/client/active')
	.then(response => response.json())
	.then(json => json.map(s => {
		app.info(`Loading ${s}`);
		return import(s)
			.then(() => app.info(`Loading ${s} done`),
				e => app.error(`Loading ${s} error`, e));
	}));
