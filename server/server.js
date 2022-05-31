
import { start } from './server-lib-gui.js';
import serverAppFactory from './server-app.js';
import { loadConfigFromCommandLine, loadConfigFromFile, enableDebugFor, getEnabledDebug } from './server-lib-config.js';
import { resetConfig } from './server-lib-config.js';

const app = serverAppFactory('core');

// // Enable this one for early debug:
// enableDebugFor('kiosk:loggers');

resetConfig()
	.then(() => loadConfigFromCommandLine(app))
	.then((cmdConfig) => {
		if (cmdConfig.devMode) {
			enableDebugFor('kiosk:loggers');
		}
		return cmdConfig;
	})
	.then((cmdConfig) => loadConfigFromFile(app, [cmdConfig.file, 'etc/kiosk.yml']))
	.then((config) => {
		//
		// Override with command line options
		//
		if (app.getConfig('server.devMode', false)) {
			app.debug('Versions', process.versions);
			app.info('Node version: ', process.versions['node']);
		}

		app.debug('Final config: ', config);

		//
		// Activate some loggers
		//
		if (config?.core?.loggers) {
			for (const re of config.core.loggers) {
				app.info('Enabling logging level due to configuration: ', re);
				enableDebugFor(re);
			}
		}
	})
	.then(() => {
		app.setState({
			devMode: app.getConfig('server.devMode', false),
			enabledDebug: getEnabledDebug()
		});
	})
	.then(() => {
		/**
		 * @param {string} name of the package (xxx without extension)
		 */
		async function loadPackage(name) {
			try {
				app.debug(`loading ${name}`);
				import(`../packages/${name}/${name}-server.mjs`);
				app.debug(`loading ${name}`);
			} catch (err) {
				app.error(`Error loading ${name}: `, err);
			}
		}

		return Promise.all([
			loadPackage('menu'),

			loadPackage('camera'),
			loadPackage('clock'),
			loadPackage('fire'),
			loadPackage('music'),
			loadPackage('photo-frame'),
			loadPackage('system')
		])
			.then(() => { });
	})
	.then(() => start(app))
	.then(() => app.info('GUI is started'));
