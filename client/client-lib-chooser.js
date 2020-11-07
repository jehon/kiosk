
const applicationList = new Map();

/**
 * @param {module:client/ClientApp} newApp to be registered
 * @returns {number} is the id of the application
 */
export function registerApp(newApp) {
	applicationList.set(newApp.name, newApp);
	const id = applicationList.size;

	newApp.id = id;

	autoSelectApplication();

	return id;
}

/**
 * Select the current application based on priority
 *
 * @returns {module:client/ClientApp} the selected application
 */
export function autoSelectApplication() {
	const selectedApplication = Array.from(applicationList.values())
		.filter(a => a.mainElement && a.priority)
		// < 0 ? a is before b
		.sort((a, b) => (a.priority - b.priority))[0];
	return renderApplication(selectedApplication);
}

let currentApplication = null;

/**
 * Use the currentApplication and render it (if it did change)
 *
 * @param {module:client/ClientApp} newApplication to be rendered
 * @returns {module:client/ClientApp} the rendered application
 */
function renderApplication(newApplication) {
	if (!newApplication) {
		return currentApplication;
	}

	if (currentApplication?.id == newApplication.id) {
		return newApplication;
	}

	const mainAppElement = document.querySelector('#main-application');
	if (mainAppElement == null) {
		throw 'registerMainContainer: #main-application is null';
	}

	newApplication.debug(`I have been selected ${newApplication.toJSON()}`);

	// Reject not "main" application
	if (!('mainElement' in newApplication)) {
		newApplication.error(`... but I don't have a main (${newApplication.toJSON()})`);
		mainAppElement.innerHTML = `<div>No main element available for app ${newApplication.getName()}: ${JSON.stringify(newApplication)}</div>`;
		return currentApplication;
	}

	// Ok, let's go !
	mainAppElement.innerHTML = '';

	const me = newApplication.mainElement;
	if (typeof (me) == 'function') {
		me(mainAppElement);
	} else {
		mainAppElement.appendChild(me);
	}

	currentApplication = newApplication;
}



/*
 *
 *
 *
 * LEGACY
 *
 *
 */



// let manualSelectionTimer = false;

// /**
//  *
//  */
// function relaunchActivity() {
// 	// Forget previous timer
// 	if (manualSelectionTimer) {
// 		app.debug('Restart of manual mode', new Date());
// 		clearTimeout(manualSelectionTimer);
// 	} else {
// 		app.debug('Start of manual mode', new Date());
// 	}

// 	// Program new timer
// 	manualSelectionTimer = setTimeout(() => {
// 		if (manualSelectionTimer) {
// 			app.debug('End of manual mode');
// 			clearTimeout(manualSelectionTimer);

// 			// Trigger a new calculation of the top app
// 			autoSelectApp(getApplicationsList());
// 		}
// 		manualSelectionTimer = false;

// 	}, 2 * 60 * 1000);
// }

// /**
//  * @param app
//  */
// export default function selectApplication(app) {
// 	relaunchActivity();
// 	currentApplication = app;
// 	dispatchApp();
// }

// app.subscribe('apps.list', (list) => manualSelectionTimer || autoSelectApp(list));
// app.subscribe('caffeine.actity', (active) => active && relaunchActivity());

// /**
//  * @param {string} name of the application
//  */
// export function getApplicationByName(name) {
// 	if (!(name in apps)) {
// 		throw `Unknown app: ${name}. Available: ${Object.keys(apps).join(' ')}`;
// 	}
// 	return apps[name];
// }

//
// TODO: move all this into client-lib-chooser (begin)
//
