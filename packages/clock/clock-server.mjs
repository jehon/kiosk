
import serverAppFactory from '../../server/server-app.js';

/*
Status:

{
	currentTicker: {
		stat: {
			start
			end
			duration
		}
		name
		cron
		duration
		...aTickerConfig (all from config in yml)
	}
}

*/

/**
 * @type {module:server/ServerApp}
 */
const app = serverAppFactory('clock');
export default app;

/**
 * Called when a ticker start
 * Need to program the end of the ticker
 *
 * @param {object} data to be passed to the ticker
 */
function onTicker(data) {
	app.debug('Ticker started:', data);
	const status = app.getState();
	status.currentTicker = data;
	app.setState(status);

	app.onDate(status.currentTicker.stat.end).then(() => {
		const status = app.getState();

		// Is it the current ticker?
		if (status.currentTicker && status.currentTicker.triggerDate == data.triggerDate) {
			// We have this event, so let's stop it and become a normal application again...
			status.currentTicker = null;
			app.debug('ticker ended:', data);
			app.setState(status);
		} else {
			app.debug('ticker overriden:', data);
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
	app.setState({
		currentTicker: null
	});

	while (registered.length > 0) {
		const stop = registered.pop();
		stop();
	}

	const config = {
		tickers: [],
		...app.getConfig('.')
	};

	app.debug('Programming config cron\'s', config);
	if (config.tickers) {
		for (const l of Object.keys(config.tickers)) {
			const aTickerConfig = config.tickers[l];
			app.debug('Programming:', l, aTickerConfig);
			registered.push(app.cron(onTicker, {
				cron: aTickerConfig.cron,
				duration: aTickerConfig.duration,
				data: {
					name: l,
					...aTickerConfig
				}
			}));
		}
	}
	return app;
}

init();
