/**
 * @param {string} n - non normalized namespace
 * @returns {string} the normalized namespace
 */
export function loggerCanonizeNamespace(n) {
  if (!n.startsWith("kiosk")) {
    n = "kiosk." + n;
  }
  return n.split(".").join(":").replace(/:+/g, ":");
}

export class Logger {
  /** @type {string} */
  name;

  /**
   *
   * @param {string} name of the logger
   */
  constructor(name) {
    this.name = name;
  }

  /**
   * Log an error
   *
   * @param  {...any} data - what to print
   * @returns {Logger} this
   */
  error(...data) {
    console.error(this.name, ...data);
    return this;
  }

  /**
   * Log an info
   *
   * @param  {...any} data - what to print
   * @returns {Logger} this
   */
  info(...data) {
    console.info(this.name, ...data);
    return this;
  }

  /**
   * Log a debug message
   *
   * @param  {...any} data - what to print
   * @returns {Logger} this
   */
  debug(...data) {
    // eslint-disable-next-line
    console.debug(this.debug, ...data);
    return this;
  }
}
