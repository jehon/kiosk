
const serverAPIFactory = require('../../server/server-api.js');
const app = serverAPIFactory('clock');

const config = {
	tickers: [],
	...app.getConfig()
};

/**
 * Resolve a promise on a certain date
 *
 * @param {Date} date the date on which the promise will be resolved
 * @returns {Promise<void>} a promise resolving on date
 */
async function onDate(date) {
	app.debug('onDate: Programming for ', date);
	return new Promise((resolve, _reject) => {
		if (typeof (onDate) == 'string') {
			date = new Date(date);
		}
		const now = new Date();
		if (date < now) {
			app.debug('onDate: but it was already in the past, triggering immediately');
			return resolve();
		}
		setTimeout(() => {
			app.debug('onDate: is now the wanted time ', date);
			resolve();
		}, date.getTime() - now.getTime());
	});
}

// TODO: should be initiated by previous ticker on startup
let ticker = null;

/**
 * @param data
 */
function onTicker(data) {
	ticker = data;
	app.dispatchToBrowser('.ticker');

	onDate(ticker.stat.end).then(() => {
		app.debug('ticker on date', data);
		// Is it the current ticker?
		if (ticker && ticker.triggerDate == data.triggerDate) {
			// We have this event, so let's stop it and become a normal application again...
			app.dispatchToBrowser('.ticker');
		}
	});
}

app.debug('Programming config cron\'s');
for (const l of Object.keys(config.tickers)) {
	const f = config.tickers[l];
	app.debug('Programming: ', l, f);
	app.addSchedule(onTicker, f.cron, f.duration, {
		label: l,
		...f
	});
}

module.exports.getCurrentTicker = () => ticker;
