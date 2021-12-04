
import serverAppFactory from '../../server/server-app.js';

/*
Status:
{
	currentTicker: {

	}
	config: {
		cron
		duration
		type
		url
	}
}

*/

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
function onCron(data) {
	const status = app.getState();
	app.debug('Fire cron started:', data);
	status.currentTicker = data;
	app.setState(status);

	app.onDate(status.currentTicker.stat.end).then(() => {
		const status = app.getState();
		// Is it the current ticker?
		if (status.currentTicker && status.currentTicker.triggerDate == data.triggerDate) {
			app.debug('Fire cron ended:', data);
			// We have this event, so let's stop it and become a normal application again...
			status.currentTicker = null;
			app.setState(status);
		} else {
			app.debug('Fire cron override:', data);
		}
	});
}

let disableCron = null;

/**
 * Initialize the package
 *
 * @returns {module:server/ServerApp} the app
 */
export function init() {
	app.debug('Programming fire cron\'s');
	if (disableCron) {
		disableCron();
	}

	disableCron = app.cron(onCron, app.getConfig('.cron', ''), app.getConfig('.duration', 30));

	app.setState(status);

	return app;
}

init();
