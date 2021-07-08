
/**
 * Callback for logging stream
 *
 * @callback LoggerStreamFunction
 * @param {*} args - to be logged
 */

/**
 * @callback LoggerStreamFunctionBuilder
 * @param {string} namespace
 * @param {string} level
 * @returns {Logger} built
 */

/**
 * @param {string} n - non normalized namespace
 * @returns {string} the normalized namespace
 */
export function loggerCanonizeNamespace(n) {
    if (!n.startsWith('kiosk')) {
        n = 'kiosk.' + n;
    }
    return n.split('.').join(':').replace(/:+/g, ':');
}

export class Logger {
    /** @type {string} */
    name

    #streams = {
        error: (..._args) => { },
        debug: (..._args) => { },
        info: (..._args) => { }
    }

    /** @type {LoggerStreamFunctionBuilder} */
    #loggerStreamFunctionBuilder

    /**
     * @type {function(string, string): LoggerStreamFunction} streamFactory to send the log
     */
    static streamFactory = () => { };

    /**
     *
     * @param {string} name of the logger
     * @param {LoggerStreamFunctionBuilder} loggerStreamFunctionBuilder to send the log
     */
    constructor(name, loggerStreamFunctionBuilder) {
        this.name = loggerCanonizeNamespace(name);
        this.#loggerStreamFunctionBuilder = loggerStreamFunctionBuilder;

        loggerMap.set(this.name, this);

        this.#streams.debug = loggerStreamFunctionBuilder(this.name, 'debug');
        this.#streams.info = loggerStreamFunctionBuilder(this.name, 'info');
        this.#streams.error = loggerStreamFunctionBuilder(this.name, 'error');
    }

    childLogger(name) {
        return new Logger(this.name + ':' + name, this.#loggerStreamFunctionBuilder);
    }

    /**
     * Log an error
     *
     * @param  {...any} data - what to print
     * @returns {Logger} this
     */
    error(...data) {
        this.#streams.error(...data);
        return this;
    }

    /**
     * Log an info
     *
     * @param  {...any} data - what to print
     * @returns {Logger} this
     */
    info(...data) {
        this.#streams.info(...data);
        return this;
    }

    /**
     * Log a debug message
     *
     * @param  {...any} data - what to print
     * @returns {Logger} this
     */
    debug(...data) {
        this.#streams.debug(...data);
        return this;
    }
}

/**
 * For dynamic loggers
 */
const loggerMap = new Map();
// const loggersCreationStream = debugFactory('kiosk:loggers');

/**
 * @param {string} namespace to be created
 * @param {LoggerStreamFunctionBuilder} loggerStreamFunctionBuilder for building a new one
 * @returns {Logger} created
 */
export default function loggerFactory(namespace, loggerStreamFunctionBuilder) {
    if (loggerMap.has(namespace)) {
        return loggerMap.get(namespace);
    }
    return new Logger(namespace, loggerStreamFunctionBuilder);
}
