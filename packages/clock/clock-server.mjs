
import serverAPIFactory from '../../server/server-api.mjs';
const serverAPI = serverAPIFactory('clock');

const logger = serverAPI.logger;

const config = {
	tickers: [],
	...serverAPI.getConfig()
};

logger.info('Programming config cron\'s');
for(const l of Object.keys(config.tickers)) {
	const f = config.tickers[l];
	logger.debug('Programming: ', l, f);
	serverAPI.addSchedule('.ticker', f.cron, f.duration, {
		label: l,
		...f
	});
}

serverAPI.subscribe('.ticker', (data) => serverAPI.dispatchToBrowser('.ticker', data));
