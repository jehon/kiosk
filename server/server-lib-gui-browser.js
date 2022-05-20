import { Logger } from '../common/logger.js';

/**
 * @param {boolean} _devMode to enable de
 */
export async function guiPrepare(_devMode) {
}

/**
 * @param {Logger} _logger to log debug
 * @param {boolean} _devMode to enable de
 * @param {string} _url to be loaded
 */
export async function guiLaunch(_logger, _devMode, _url) {
}

/**
 * @param {string} _eventName to be sent
 * @param {object} _data to be sent
 */
export function guiDispatchToBrowser(_eventName, _data) {
}

/**
 * @param {string} _channel to listen to
 * @param {function(any):void} _cb with message
 */
export function guiOnClient(_channel, _cb) {
}
