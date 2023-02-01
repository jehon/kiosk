
import Callback from './callback.js';
import contextualize from './contextualize.js';
import { Logger } from './logger.js';
import TimeInterval from './TimeInterval.js';
import { cloneDeep } from '../node_modules/lodash-es/lodash.js';
import { ACTIVITY_SUB_CHANNEL } from './constants.js';

import Cron from '../node_modules/croner/dist/croner.min.mjs';

let idGenerator = 1;

/**
 * @typedef {object} CronStats send for cron
 * @property {Date} when as date
 * @property {Date} end as date
 * @property {number} duration in minutes
 */

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
    #stateCallback;

    /**
     *
     * @param {string} name of the app
     * @param {function(string): Logger} loggerFactory to build up loggers
     * @param {*} initialState to initialize the state
     */
    constructor(name, loggerFactory, initialState) {
        this.id = idGenerator++;
        this.name = name;
        this.logger = loggerFactory(this.name);
        this.ctxize = contextualize(name);
        this.#stateCallback = new Callback(initialState);
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
            ...data
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
	 * Program a cron scheduler
	 *
	 * @param {function(CronStats,*):void} cb callback
	 * @param {object} options to configure the cron
	 * @param {string} options.cron 5 stars (min hours dom month[1-12] dow[0sun-6]) (if empty, make nothing [usefull for testing])
	 * @param {number} options.duration in minutes
	 * @param {*} options.data to pass to the signal
	 * @returns {Function} stop to halt the cron
	 */
    cron(cb, options) {
        if (!options.cron) {
			return () => { };
		}

        // What time is it now?
        const now = new Date();
        now.setMilliseconds(0);

        //
        // We look in the back, to see if the last event is still running or not
        // The last event is running if
        //    - it is started less than "duration" minutes ago
        //
        // => look "duration" in the past, and see if a event should have start during
        //    that time
        //
        const lookBackUpto = new Date(now);
        lookBackUpto.setMinutes(lookBackUpto.getMinutes() - options.duration);

		/**
		 * When cron is triggered
		 *
		 * @param {Date} whenShouldTrigger the start of the ticker (could be now)
		 */
        const onCron = async (whenShouldTrigger = new Date()) => {
            const stats = {
                start: whenShouldTrigger,
                end: new Date(whenShouldTrigger.getTime() + options.duration * 60 * 1000),
                duration: options.duration // minutes
            };

            try {
                await cb(options.data, stats);
			} catch (e) {
                this.error(`notifying on ${options.cron} gave an error: `, e);
			}
		};

        const cronParsed = new Cron(options.cron);

        if (options.duration > 0) {
            //
            // We look in the back, to see if the last event is still running or not
            // The last event is running if
            //    - it is started less than "duration" minutes ago
            //
            // => look "duration" in the past, and see if a event should have start during
            //    that time
            //

            const lookBackUpto = new Date(now);
            lookBackUpto.setMinutes(lookBackUpto.getMinutes() - options.duration - 0.1);
            const nextStartingFromBack = cronParsed.next(lookBackUpto);

            if (nextStartingFromBack < now) {
                this.debug(`Initiating past cron for ${options.cron} (${options.cron}) about ${nextStartingFromBack} on ${now} with duration ${options.duration}`);
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
                onCron(next);
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
