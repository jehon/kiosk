export default class TimeInterval {
  iSecs;

  iTimer;

  debug;

  cb;

  name;

  /**
   * To run periodically
   *
   * @param {function(TimeInterval): any} cb to be called
   * @param {number} iSecs between calls
   * @param {*} logger to log errors
   */
  constructor(cb, iSecs = 60, logger = console) {
    this.iSecs = iSecs;
    this.cb = cb;
    this.logger = logger;
    this.name = this.constructor.name;
  }

  _set(cb, time) {
    return setInterval(cb, time);
  }

  _clear(timer) {
    return clearInterval(timer);
  }

  setISecs(iSecs) {
    this.iSecs = iSecs;
    if (this.isRunning()) {
      this.start();
    }
    return this;
  }

  run() {
    try {
      this.logger.debug(`Running ${this.name}...`);
      this.cb(this);
      this.logger.debug(`Running ${this.name} done`);
    } catch (e) {
      this.logger.error("In every seconds: ", e, this.cb);
    }
  }

  /**
   * (Re-)Start the chrono (if iSecs > 0)
   *
   * @returns {TimeInterval} for chaining
   */
  start() {
    this.stop();
    if (this.iSecs > 0) {
      this.iTimer = this._set(() => this.run(), this.iSecs * 1000);
    }
    return this;
  }

  stop() {
    if (this.isRunning()) {
      this._clear(this.iTimer);
    }
    this.iTimer = null;
  }

  isRunning() {
    return !!this.iTimer;
  }
}
