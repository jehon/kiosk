
import Callback from './callback.js';
import contextualize from './contextualize.js';
import { Logger } from './logger.js';
import TimeInterval from './TimeInterval.js';
import { cloneDeep } from '../node_modules/lodash-es/lodash.js';
import { ACTIVITY_SUB_CHANNEL } from './constants.js';

import Cron from '../node_modules/croner/dist/croner.min.mjs';

let idGenerator = 1;

export default class App {
    /** @type {number} */
    id;

    /** @type {string}  */
    name;

    /** @type {Logger} */
    logger;

    /** @type {function(string): string} */
    ctxize;

    /**
     * Register when internal state change
     *
     * @type {Callback}
     */
    #stateCallback = new Callback({});

    /**
     *
     * @param {string} name of the app
     * @param {function(string): Logger} loggerFactory to build up loggers
     */
    constructor(name, loggerFactory) {
        this.id = idGenerator++;
        this.name = name;
        this.logger = loggerFactory(this.name);
        this.ctxize = contextualize(name);
    }

    toJSON() {
        return this.name + '#' + this.id;
    }

    //
    //
    // Logging functions
    //
    //

    /**
     * Log an error
     *
     * @param  {...any} data - what to print
     * @returns {this} this
     */
    error(...data) {
        this.logger.error(...data);
        return this;
    }

    /**
     * Log an info
     *
     * @param  {...any} data - what to print
     * @returns {this} this
     */
    info(...data) {
        this.logger.info(...data);
        return this;
    }

    /**
     * Log a debug message
     *
     * @param  {...any} data - what to print
     * @returns {this} this
     */
    debug(...data) {
        this.logger.debug(...data);
        return this;
    }

    childLogger(subLoggerName) {
        return this.logger.childLogger(subLoggerName);
    }

    //
    //
    // Time functions
    //
    //

    // TODO: obsolete
    addTimeInterval(cb, iSecs) {
        return new TimeInterval(cb, iSecs, this.childLogger('time-interval'));
    }

    //
    //
    // Status
    //
    //

    /**
     * Dispatch a status to the browser
     *
     * @param {object} data as the new status
     * @returns {this} this
     */
    setState(data) {
        this.#stateCallback.emit(data);
        return this;
    }

    /**
     * @returns {object} the state of the application
     */
    getState() {
        return cloneDeep(this.#stateCallback.getState());
    }

    /**
     * Dispatch a status to the browser
     *
     * @param {object} data as the alteration
     * @returns {object} as the new status
     */
    mergeState(data) {
        const newState = {
            ...this.getState(),
            data
        };
        this.setState(newState);
        return newState;
    }

    /**
     * @param {function(object, App):void} cb to listen for change
     * @returns {function(void):void} to stop the listener
     */
    onStateChange(cb) {
        return this.#stateCallback.onChange((state) => cb(state, this));
    }

    getChannel(ch = ACTIVITY_SUB_CHANNEL) {
        return this.name + ch;
    }

	/**
	 * @param {Function} cb callback
	 * @param {string} cron 5 stars (min hours dom month[1-12] dow[0sun-6]) (if empty, make nothing [usefull for testing])
	 * @param {number} duration in minutes
	 * @param {*} data to pass to the signal (will be completed)
	 * @returns {Function} stop to halt the cron
	 */
	cron(cb, cron, duration = 0, data = {}) {
		// TODO: cron could be an array

		if (cron == '') {
			return () => { };
		}

		/**
		 * When cron is triggered
		 *
		 * @param {Date} when the start of the ticker (could be now)
		 */
		const onCron = async (when = new Date()) => {
			const now = new Date();
			now.setMilliseconds(0);
			try {
				await cb({
					stat: {
						start: when,
						end: new Date(when.getTime() + duration * 60 * 1000),
						duration // minutes
					}, ...data
				});
			} catch (e) {
				this.error(`notifying on ${cron} gave an error: `, e);
			}
		};

		const cronParsed = new Cron(cron);

		if (duration > 0) {
            const now = new Date();

            //
            // We look in the back, to see if the last event is still running or not
            // The last event is running if
            //    - it is started less than "duration" minutes ago
            //
            // => look "duration" in the past, and see if a event should have start during
            //    that time
            //

            const lookBackUpto = new Date(now);
            lookBackUpto.setMinutes(lookBackUpto.getMinutes() - duration - 0.1);
            const nextStartingFromBack = cronParsed.next(lookBackUpto);
            const isRunning = (nextStartingFromBack < now);

			if (isRunning) {
				this.debug(`Initiating past cron for ${cron} (${cron}) about ${nextStartingFromBack} on ${new Date()} with duration ${duration}`);
				// TODO: manage currently running tickers
				onCron(nextStartingFromBack);
			}
		}

		let tsId = 0;
		const program = () => {
			const next = new Date(cronParsed.next());
			const ds = next - new Date();
			//
			// Can not make it longer than 2^32
			// And we take some security
			//
			// 2^32 = 12 days, 2^30 = 4 days
			//
			if (ds > Math.pow(2, 30)) {
				return;
			}
			tsId = setTimeout(() => {
				program();
				onCron();
			}, ds);
		};
		program();
		return () => clearTimeout(tsId);
	}

    /**
     * Resolve a promise on a certain date
     *
     * @param {Date} date the date on which the promise will be resolved
     * @returns {Promise<void>} a promise resolving on date
     */
	async onDate(date) {
		return new Promise((resolve, _reject) => {
			if (typeof (date) == 'string') {
				date = new Date(date);
			}
			const now = new Date();
			if (date < now) {
				this.debug('onDate: but it was already in the past, triggering immediately');
				return resolve();
			}
			setTimeout(() => resolve(), date.getTime() - now.getTime());
		});
	}
}
