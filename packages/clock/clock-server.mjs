
import serverAppFactory from '../../server/server-app.mjs';
const app = serverAppFactory('clock');

const config = {
	tickers: [],
	...app.getConfig('.')
};

const status = {
	currentTicker: null
};

/**
 * Resolve a promise on a certain date
 *
 * @param {Date} date the date on which the promise will be resolved
 * @returns {Promise<void>} a promise resolving on date
 */
async function onDate(date) {
	return new Promise((resolve, _reject) => {
		if (typeof (onDate) == 'string') {
			date = new Date(date);
		}
		const now = new Date();
		if (date < now) {
			app.debug('onDate: but it was already in the past, triggering immediately');
			return resolve();
		}
		setTimeout(() => resolve(), date.getTime() - now.getTime());
	});
}

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

	onDate(status.currentTicker.stat.end).then(() => {
		app.debug('ticker ended:', data);
		// Is it the current ticker?
		if (status.currentTicker && status.currentTicker.triggerDate == data.triggerDate) {
			// We have this event, so let's stop it and become a normal application again...
			status.currentTicker = null;
			app.setState(status);
		}
	});
}

app.debug('Programming config cron\'s');
for (const l of Object.keys(config.tickers)) {
	const aTickerConfig = config.tickers[l];
	app.debug('Programming:', l, aTickerConfig);
	app.cron(onTicker, aTickerConfig.cron, aTickerConfig.duration, {
		label: l,
		...aTickerConfig
	});
}

// TODO: manage currently running tickers
