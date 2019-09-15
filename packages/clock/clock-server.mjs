
import serverAPIFactory from '../../server/server-api.mjs';
const app = serverAPIFactory('clock:server');

const config = {
	tickers: [],
	...app.getConfig()
};

app.info('Programming config cron\'s');
for(const l of Object.keys(config.tickers)) {
	const f = config.tickers[l];
	app.debug('Programming: ', l, f);
	app.addSchedule('.ticker', f.cron, f.duration, {
		label: l,
		...f
	});
}

app.subscribe('.ticker', (data) => app.dispatchToBrowser('.ticker', data));
