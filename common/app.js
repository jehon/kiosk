
import Callback from './callback.js';
import contextualize from './contextualize.js';
import { Logger } from './logger.js';
import TimeInterval from './TimeInterval.js';
import { cloneDeep } from '../node_modules/lodash-es/lodash.js';
import { ACTIVITY_SUB_CHANNEL } from './constants.js';

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
     * @param {function(object, App):void} cb to listen for change
     * @returns {function(void):void} to stop the listener
     */
    onStateChange(cb) {
        return this.#stateCallback.onChange((state) => cb(state, this));
    }

    getChannel(ch = ACTIVITY_SUB_CHANNEL) {
        return this.name + ch;
    }
}
