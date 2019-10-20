
import clientAPIFactory, { getApplicationsList } from './client-api.js';

const app = clientAPIFactory('core:client:chooser');
let currentApplication = null;
let manualSelectionTimer = false;

function relaunchActivity() {
	// Forget previous timer
	if (manualSelectionTimer) {
		app.debug('Restart of manual mode', new Date());
		clearTimeout(manualSelectionTimer);
	} else {
		app.debug('Start of manual mode', new Date());
	}

	// Program new timer
	manualSelectionTimer = setTimeout(() => {
		if (manualSelectionTimer) {
			app.debug('End of manual mode');
			clearTimeout(manualSelectionTimer);

			// Trigger a new calculation of the top app
			autoSelectApp(getApplicationsList());
		}
		manualSelectionTimer = false;

	}, 2 * 60 * 1000);
}

function dispatchApp() {
	if (currentApplication) {
		app.debug('New currentMainApplication', currentApplication.name);
		app.dispatch('apps.current', currentApplication);
	}
}

function autoSelectApp(list) {
	currentApplication = list.filter(a => a.mainElement && a.priority)[0];
	app.debug('Selecting application automatically', currentApplication ? currentApplication.name : 'no available');
	dispatchApp();
}

export default function selectApplication(app) {
	relaunchActivity();
	currentApplication = app;
	dispatchApp();
}

app.subscribe('apps.list', (list) => manualSelectionTimer || autoSelectApp(list));
app.subscribe('caffeine.actity', (active) => active && relaunchActivity());
