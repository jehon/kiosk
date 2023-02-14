import debugFactory from "debug";
import chalk from "chalk";

import loggerFactory, { Logger } from "../common/logger.js";

export const loggersCreationStream = debugFactory("kiosk:loggers");

/**
 * @param {Error} e - the error to be rendered
 * @returns {string} the error in a string presentation
 */
function loggerRenderError(e) {
  const stack = e.stack;
  return `${e.message}\n  at ${stack}`;
}

/**
 * @param {string} level - the level to be shown in the debug
 * @param {...any} args - anything to print
 * @returns {string} the message formatted for display
 */
function loggerGenerateMessage(level, ...args) {
  return (
    `[${level}] ` +
    args
      .map((v) =>
        typeof v == "object"
          ? v instanceof Error
            ? loggerRenderError(v)
            : JSON.stringify(v)
          : v
      )
      .join(" ")
  );
}

/**
 * @param {string} namespace of the logger
 * @returns {Logger} built
 */
export function serverLoggerFactory(namespace) {
  return loggerFactory(namespace, (namespace, level) => {
    switch (level) {
      case "error": {
        const dbg = debugFactory(namespace + "*");
        return (...data) =>
          dbg(chalk.red(loggerGenerateMessage("ERROR", ...data)));
      }
      case "debug": {
        loggersCreationStream(`Creating debug logger ${namespace}`);
        const dbg = debugFactory(namespace);
        return (...data) => dbg(loggerGenerateMessage("DEBUG", ...data));
      }
      case "info": {
        const dbg = debugFactory(namespace + "*");
        return (...data) => dbg(loggerGenerateMessage("INFO", ...data));
      }
      default:
        break;
    }
  });
}
