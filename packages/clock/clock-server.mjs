
import serverAppFactory from '../../server/server-app.js';

/**
 * @type {module:server/ServerApp}
 */
const app = serverAppFactory('clock');

export default app;

const status = {
	currentTicker: null
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

const registered = [];

/**
 * Initialize the package
 *
 * @returns {module:server/ServerApp} the app
 */
export function init() {
	app.setState(status);

	while (registered.length > 0) {
		const stop = registered.pop();
		stop();
	}

	const config = {
		tickers: [],
		...app.getConfig('.')
	};

	app.debug('Programming config cron\'s', config);
	for (const l of Object.keys(config.tickers)) {
		const aTickerConfig = config.tickers[l];
		app.debug('Programming:', l, aTickerConfig);
		registered.push(app.cron(onTicker, aTickerConfig.cron, aTickerConfig.duration, {
			name: l,
			...aTickerConfig
		}));
	}
	return app;
}

init();
