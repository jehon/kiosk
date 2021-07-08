
import contextualize from './contextualize.js';
import { Logger } from './logger.js';
import TimeInterval from './TimeInterval.js';

let idGenerator = 1;

export default class App {
    /** @type {number} */
    id

    /** @type {string}  */
    name

    /** @type {Logger} */
    logger

    /**  */
    #loggerFactory

    /** @type {function(string): string} */
    ctxize

    /**
     *
     * @param {string} name of the app
     * @param {function(string): Logger} loggerFactory to build up loggers
     */
    constructor(name, loggerFactory) {
        this.id = idGenerator++;
        this.name = name;
        this.logger = loggerFactory(this.name);
        this.#loggerFactory = loggerFactory;
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

    addTimeInterval(cb, iSecs) {
        return new TimeInterval(cb, iSecs, this.childLogger('time-interval'));
    }
}
