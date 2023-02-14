import loggerFactory, { Logger } from "../common/logger.js";

/**
 * @param {string} name of the logger
 * @returns {Logger} built
 */
export function clientLoggerFactory(name) {
  return loggerFactory(name, (namespace, level) => (...data) => {
    /* eslint-disable no-console */
    console[level](namespace, `[${level.toUpperCase()}]`, ...data);
  });
}
