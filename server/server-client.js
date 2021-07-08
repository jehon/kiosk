
import { serverLoggerFactory } from './server-customs.js';

/**
 * Allow remote* to log on the server
 *
 * @param {module:common/LogMessage} message to be received
 */
export function loggerAsMessageListener(message) {
    const namespace = message.namespace ?? 'test';
    const logger = serverLoggerFactory(namespace);
    logger[message.level](...message.content);
}
