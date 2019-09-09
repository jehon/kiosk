
// https://www.npmjs.com/package/cron
import CronJob from '../node_modules/cron/lib/cron.js';
import cronstrue from '../node_modules/cronstrue/dist/cronstrue.js';

export default class Scheduler {
	/**
	 * constructor:
	 *
	 * @param notify : for signal's only
	 * @param logger : for logging
	 */
	constructor(notify, logger = console) {
		this.notify = notify;
		this.logger = logger;
	}

	/**
	 * @param {string/function} eventNameOrFunction
	 * @param {*} cron 5 stars ([secs] min hours dom month dow) (if empty, make nothing [usefull for testing])
	 * @param {int} duration in minutes
	 * @param {*} data to pass to the signal
	 */
	addCron(eventNameOrFunction, cron, duration, data) {
		if (cron == '') {
			return () => {};
		}
		if (cron.split(' ').length == 5) {
			cron = '0 ' + cron;
		}

		this.logger.debug(`Programming task for ${eventNameOrFunction}: ${cronstrue.toString(cron)}`);

		const job = new CronJob.CronJob(cron, async () => {
			const now = new Date();
			now.setMilliseconds(0);
			try {
				const arg = { stat: {
					start: now,
					end: new Date(now.getTime() + duration * 60 * 1000),
					duration // minutes
				}, ...data};
				if (typeof eventNameOrFunction == 'function') {
					await eventNameOrFunction(arg);
				} else {
					this.logger.debug('Notifying', eventNameOrFunction, arg);
					await this.notify(eventNameOrFunction, arg);
				}
			} catch(e) {
				this.logger.error('Scheduler: notifying gave an error for signal', eventNameOrFunction, ': ', e);
			}
		});
		job.start();
		return () => job.stop();
	}
}
