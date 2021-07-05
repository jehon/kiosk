
let appId = 1;
const applicationList = new Map();

/**
 * Sort elements of the list by priority
 *   0: lowest priority
 *
 * Remember:
 *    < 0 ? a is before b
 *
 * @param {module:client/ClientApp} a to be compared
 * @param {module:client/ClientApp} b to be compared
 * @returns {number} to sort client application
 */
const sortApplication = (a, b) => (b.priority - a.priority);

/**
 * Register the application
 * and auto-select the current application (Is this ok?)
 *
 * @param {module:client/ClientApp} newApp to be registered
 * @returns {number} is the id of the application
 */
export function registerApp(newApp) {
	applicationList.set(newApp.name, newApp);
	const id = appId++;

	newApp.id = id;

	autoSelectApplication();

	return id;
}

/**
 * @param {string} name of the application
 * @returns {module:client/ClientApp} corresponding to the name
 */
export function getApplicationByName(name) {
	if (!applicationList.has(name)) {
		throw `Unknown app: ${name}. Available: ${Array.from(applicationList.keys()).join(' ')}`;
	}
	return applicationList.get(name);
}

/**
 * TODO: find a way to make an array of module:client/ClientApp
 *
 * @returns {Array<*>} with all the current applications
 */
export function getApplicationList() {
	const l = Array.from(applicationList.values());
	l.sort(sortApplication);
	return l;
}

/**
 * Select the current application based on priority
 *
 * @returns {module:client/ClientApp} the selected application
 */
export function autoSelectApplication() {
	const selectedApplication = getApplicationList()
		.filter(a => a.mainElementBuilder && a.priority)[0];
	return renderApplication(selectedApplication);
}

/**
 * Manually select the application and render it
 *
 * @param {module:client/ClientApp} app to be selected
 * @returns {module:client/ClientApp} the rendered application
 */
export function selectApplication(app) {
	return renderApplication(app);
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
	if (!('mainElementBuilder' in newApplication)) {
		newApplication.error(`... but I don't have a main (${newApplication.toJSON()})`);
		mainAppElement.innerHTML = `<div>No main element available for app ${newApplication.getName()}: ${JSON.stringify(newApplication)}</div>`;
		return currentApplication;
	}

	// Ok, let's go !
	mainAppElement.innerHTML = '';
	mainAppElement.appendChild(newApplication.buildMainElement());

	currentApplication = newApplication;
}
