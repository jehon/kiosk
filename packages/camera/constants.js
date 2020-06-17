/**
 * @typedef {import('../../server/server-logger.js').Logger} Logger
 */

const serverAPIFactory = require('../../server/server-api.js');

const app = serverAPIFactory('camera');
module.exports.app = app;

/**
 * @readonly
 * @enum {string}
 */
const TriStates = {
	/** Could show the video feed */
	READY: 'READY',
	/** Camera is up, but video feed is not ready */
	UP_NOT_READY: 'UP_NOT_READY',
	/** Camera is completely down */
	DOWN: 'DOWN'
};
Object.freeze(TriStates);
module.exports.TriStates = TriStates;

/**
 * @typedef CheckResponse
 * @property {TriStates} state - the state of the camera
 * @property {string} message  - a message to show to the user
 */

/**
 * @typedef CameraAPI
 * @property {function():object} defaultConfig - return the default config of the camera
 * @property {function(object, any):Promise} init - configure the camera once, when up (or again if connection is lost)
 * @property {function(Logger, object):Promise<CheckResponse>} check - tell if the camera is ready / up / down
 * @property {function(Logger, object, object):void} generateFlow - generate the flow on the paramter response
 */
