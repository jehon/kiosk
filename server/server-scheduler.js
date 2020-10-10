
// https://www.npmjs.com/package/cron
const CronJob = require('cron');
const cronstrue = require('cronstrue');

const loggerFactory = require('./server-logger.js');

module.exports = class Scheduler {
	logger;

	constructor() {
		this.logger = loggerFactory('server:scheduler');
	}

	/**
	 * @param {Function} cb callback
	 * @param {string} cron 5/6 stars ([secs] min hours dom month dow) (if empty, make nothing [usefull for testing])
	 * @param {number} duration in minutes
	 * @param {*} data to pass to the signal (will be completed)
	 */
	addCron(cb, cron, duration, data) {
		if (cron == '') {
			return () => { };
		}

		this.logger.debug(`Programming event: ${cronstrue.toString(cron)}`);

		if (cron.split(' ').length == 5) {
			// Add second's
			cron = '0 ' + cron;
		}

		const job = new CronJob.CronJob(cron, async () => {
			const now = new Date();
			now.setMilliseconds(0);
			try {
				await cb({
					stat: {
						start: now,
						end: new Date(now.getTime() + duration * 60 * 1000),
						duration // minutes
					}, ...data
				});
			} catch (e) {
				this.logger.error('notifying ${eventName} gave an error: ', e);
			}
		});
		job.start();
		return () => job.stop();
	}
};
