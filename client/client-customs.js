
import loggerFactory, { Logger } from '../common/logger.js';
import { sendLogToServer } from './client-server.js';

/**
 * @param {string} name of the logger
 * @returns {Logger} built
 */
export function clientLoggerFactory(name) {
    return loggerFactory(name,
        (namespace, level) =>
            (...data) => {
                /* eslint-disable no-console */
                console[level](namespace, `[${level.toUpperCase()}]`, ...data);
                sendLogToServer({
                    namespace,
                    level,
                    content: data.map(e => (e instanceof Object ? JSON.stringify(e) : e))
                });
            }
    );
}
