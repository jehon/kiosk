
import loggerFactory from './client-logger.js';
const logger = loggerFactory('core:client:helpers');

// clock-client
export async function onDate(date) {
	logger.debug('onDate: Programming for ', date);
	return new Promise((resolve, _reject) => {
		if (typeof(onDate) == 'string') {
			date = new Date(date);
		}
		const now = new Date();
		if (date < now) {
			logger.debug('onDate: but it was already in the past, triggering immediately');
			return resolve();
		}
		setTimeout(() => {
			logger.debug('onDate: is now the wanted time ', date);
			resolve();
		}, date - now);
	});
}
