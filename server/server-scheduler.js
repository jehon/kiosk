
// https://www.npmjs.com/package/cron
import CronJob from '../node_modules/cron/lib/cron.js';
import cronstrue from '../node_modules/cronstrue/dist/cronstrue.js';

import loggerFactory from './server-logger.js';

export default class Scheduler {
	logger;
	bus;

	constructor(bus) {
		this.bus    = bus;
		this.logger = loggerFactory('core:server:scheduler');
	}

	/**
	 * @param {string} eventNameOrFunction
	 * @param {string} cron 5/6 stars ([secs] min hours dom month dow) (if empty, make nothing [usefull for testing])
	 * @param {int}    duration in minutes
	 * @param {*}      data to pass to the signal (will be completed)
	 */
	addCron(eventName, cron, duration, data) {
		if (cron == '') {
			return () => {};
		}

		this.logger.debug(`Programming event ${eventName}: ${cronstrue.toString(cron)}`);

		if (cron.split(' ').length == 5) {
			// Add second's
			cron = '0 ' + cron;
		}

		const job = new CronJob.CronJob(cron, async () => {
			const now = new Date();
			now.setMilliseconds(0);
			try {
				await this.bus.dispatch(eventName, { stat: {
					start: now,
					end: new Date(now.getTime() + duration * 60 * 1000),
					duration // minutes
				}, ...data});
			} catch(e) {
				this.logger.error('notifying ${eventName} gave an error: ', e);
			}
		});
		job.start();
		return () => job.stop();
	}
}
