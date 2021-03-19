
import serverAppFactory from '../../server/server-app.js';

/**
 * @type {module:server/ServerApp}
 */
const app = serverAppFactory('fire');

export default app;

const status = {
	currentTicker: null,
	config: app.getConfig()
};

/**
 * Called when a ticker start
 * Need to program the end of the ticker
 *
 * @param {object} data to be passed to the ticker
 */
function onTicker(data) {
	app.debug('Ticker started:', data);
	status.currentTicker = data;
	app.setState(status);

	app.onDate(status.currentTicker.stat.end).then(() => {
		app.debug('ticker ended:', data);
		// Is it the current ticker?
		if (status.currentTicker && status.currentTicker.triggerDate == data.triggerDate) {
			// We have this event, so let's stop it and become a normal application again...
			status.currentTicker = null;
			app.setState(status);
		}
	});
}

let cron = null;

/**
 * Initialize the package
 *
 * @returns {module:server/ServerApp} the app
 */
export function init() {
	app.debug('Programming fire cron\'s');
	if (cron) {
		cron();
	}
	// TODO: cron could be an array
	cron = app.cron(onTicker, app.getConfig('.cron', ''), app.getConfig('.duration', 30));

	app.setState(status);

	return app;
}

init();
