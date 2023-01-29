
import App from '../common/app.js';

import getConfig from './server-lib-config.js';
import { dispatchToBrowser } from './server-lib-gui.js';
import { serverLoggerFactory } from './server-customs.js';

export class ServerApp extends App {
	constructor(name) {
		super(name,
			(namespace) => serverLoggerFactory(namespace + ':server')
		);

		this.onStateChange(
			(state) => dispatchToBrowser(this.ctxize('.status'), state)
		);
	}

	/**
	 * Get some config if it exists, return def otherwise
	 *
	 * @param {string} [opath] the path in the json
	 * @param {*} [def] - the default value if the key is not found
	 * @returns {object|any} the key or def(null) if it does not exists
	 */
	getConfig(opath = '.', def = null) {
		return getConfig(this.ctxize(opath), def);
	}
}

/**
 * @param {string} name of the context of the application
 * @returns {ServerApp} the application
 */
export default function serverAppFactory(name) {
	return new ServerApp(name);
}
