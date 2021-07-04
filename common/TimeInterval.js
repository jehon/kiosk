
export default class TimeInterval {

    iSecs

    iInterval

    logger

    cb

    /**
     * To run periodically
     *
     * @param {number} iSecs between calls
     * @param {function(TimeInterval): any} cb to be called
     * @param {*} logger to log errors
     */
    constructor(cb, iSecs = 60, logger = console) {
        this.iSecs = iSecs;
        this.cb = cb;
        this.logger = logger;
    }

    setISecs(iSecs) {
        this.iSecs = iSecs;
        if (this.isRunning()) {
            this.start();
        }
    }

    run() {
        try {
            this.logger.debug('Running TimeInterval...');
            this.cb(this);
            this.logger.debug('Running TimeInterval done');
        } catch (e) {
            this.logger.error('In every seconds: ', e, this.cb);
        }
    }

    start() {
        this.stop();
        this.iInterval = setInterval(() => this.run(), this.iSecs * 1000);
        return this;
    }

    stop() {
        if (this.isRunning()) {
            clearInterval(this.iInterval);
        }
        this.iInterval = null;
    }

    isRunning() {
        return !!this.iInterval;
    }
}
