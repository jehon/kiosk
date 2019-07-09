
import clientAPIFactory from './client-api.js';
import { getApplicationsList, currentMainApplication } from './client-api-apps.js';
import { subscribe } from './client-api-events.js';
const clientAPI = clientAPIFactory('core');

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
subscribe('app.changed', () => {
	//
	// Menu
	//
	const el = document.querySelector('#main-menu');
	if (el == null) {
		throw 'main.js: #main-menu is null';
	}
	el.innerHTML = '';

	for(const a of getApplicationsList().filter(a => a.statusElement)) {
		const ael = a.statusElement;
		el.appendChild(ael);
		if (currentMainApplication.id == a.id) {
			ael.setAttribute('selected', 'selected');
		} else {
			ael.removeAttribute('selected');
		}
		ael.addEventListener('click', () => a.goManually());
	}

	//
	// Main app
	//

	// Skip if
	// - we don't have a new application (currentMainApplication)
	// - we are already there (currentMainApplication == displayedApplication)
	if (currentMainApplication != null && (currentMainApplication.id != displayedApplication.id)) {

		// Reject not "main" application
		if (!('mainElement' in currentMainApplication)) {
			clientAPI.logger.error(`No mainElement in ${currentMainApplication.getName()}`);
			mainAppElement.innerHTML = `<div>No main element available for app ${this.getName()}: ${JSON.stringify(this)}</div>`;

		} else {

			// Ok, let's go !
			clientAPI.logger.info(`Selecting ${currentMainApplication.getName()}`);
			displayedApplication = currentMainApplication;

			mainAppElement.innerHTML = '';
			const me = currentMainApplication.mainElement;
			if (typeof(me) == 'function') {
				me(mainAppElement);
			} else {
				mainAppElement.appendChild(me);
			}
		}
	}
});

let startedTimestamp = false;
subscribe('core.started', (data) => {
	let startedTimestampNew = data.startupTime.toISOString();
	clientAPI.logger.debug('Connected back to the server: ', startedTimestampNew, startedTimestamp);
	if (startedTimestamp) {
		if (startedTimestampNew != startedTimestamp) {
			clientAPI.logger.info('New session from server: ', startedTimestampNew, 'restarting the browser');
			document.location.reload();
		}
	}
	startedTimestamp = startedTimestampNew;
});

//
// Load other packages
//

fetch('/core/packages/active')
	.then(response => response.json())
	.then(json => json.map(s => {
		clientAPI.logger.startup(`Loading ${s}`);
		return import(s)
			.then(() => clientAPI.logger.startup(`Loading ${s} done`),
				e => clientAPI.logger.startup(`Loading ${s} error`, e));
	}));
