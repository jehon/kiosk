
import debugFactory from 'debug';
import objectPath from 'object-path';
import yargs from 'yargs';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';
import yaml from 'js-yaml';
import deepMerge from 'deepmerge';

let config = {};

const enabledDebuggerFromEnv = process.env.DEBUG;
let enabledDebugger = (enabledDebuggerFromEnv ? enabledDebuggerFromEnv : '').split(',');

/**
 *
 */
export async function resetConfig() {
	config = {
		files: [
			'etc/kiosk.yml'
		],
		server: {
			devMode: false,
			root: path.dirname(fileURLToPath(import.meta.url))
		}
	};
}
resetConfig();

/**
 * @param {string} path to be found
 * @param {*} def - a default value if config is not set
 * @returns {*} the required object
 */
export default function getConfig(path = '', def = undefined) {
	if (path) {
		if (objectPath.has(config, path)) {
			const val = objectPath.get(config, path);
			return val;
		}
		return def;
	}
	return JSON.parse(JSON.stringify(config));
}

/**
 * @param {string} path where to set
 * @param {*} val to be set
 */
export function setConfig(path = '', val = {}) {
	if (path == '') {
		config = val;
		return;
	}
	objectPath.set(config, path, val);
}

/**
 * @param {string} name to be enabled above env
 * @returns {Array<string>} the final regexp
 */
export function enableDebugFor(name) {
	// Protect agains DEBUG not being defined
	enabledDebugger.push(name);
	debugFactory.enable(enabledDebugger.join(','));
	return enabledDebugger;
}

/**
 * @returns {Array<string>} the enabled debuggers
 */
export function getEnabledDebug() {
	return enabledDebugger;
}

// istanbul-ignore-next
/**
 * @param {module:server/ServerApp} serverApp where to log
 * @returns {Promise<object>} the parsed options
 */
export async function loadConfigFromCommandLine(serverApp) {
	const app = serverApp.extend('config');
	let myargs = yargs(process.argv.slice(2))
		.options({
			'file': {
				alias: 'f',
				type: 'string',
				describe: 'additionnal file configuration'
			},
			'devMode': {
				alias: ['-d', '--dev-mode'],
				type: 'boolean',
				describe: 'activate the dev mode'
			}
		})
		.help()
		.recommendCommands();

	// TODO: disable strict in case of --spectron-testing (see spectron.cjs)
	if (!('SPECTRON' in process.env)) {
		myargs = myargs.strict();
	}

	const cmdLineOptions = myargs.argv;

	// Transform into config

	if (cmdLineOptions.devMode) {
		setConfig('server.devMode', true);
	}

	if (cmdLineOptions.file) {
		app.debug('Adding configuration file at the end:', cmdLineOptions.file);
		config.files.unshift(cmdLineOptions.file);
	}

	app.debug('Command line parsed options: ', cmdLineOptions);

	setConfig('commandLine', cmdLineOptions);

	return cmdLineOptions;
}

/**
 * @param {module:server/ServerApp} serverApp where to log
 * @param {Array<string>} configFiles in order, first one found will be loaded
 * @returns {Promise<object>} the current config
 */
export async function loadConfigFromFile(serverApp, configFiles = config.files) {
	const app = serverApp.extend('config');
	app.debug('Received list of config files ' + configFiles.join(', '));

	if (typeof (jasmine) != 'undefined') {
		serverApp.info('Test mode: loading only tests/kiosk.yml');
		configFiles.length = 0;
		configFiles[0] = 'tests/kiosk.yml';
	}

	//
	// Setup some general configs
	//

	for (const i in configFiles) {
		const f = configFiles[i];
		if (!f) {
			// skip null etc...
			continue;
		}
		try {
			app.debug('Loading config file: ', f);
			let txt = fs.readFileSync(f, 'utf8');
			if (txt) {
				const doc = yaml.load(txt);
				config = deepMerge(config, doc);
				app.debug('Loaded config file ' + f);
				break;
			}
			app.error('Skipping empty config file ' + f);
		} catch (e) {
			if (e && e.code == 'ENOENT') {
				app.debug('Config file not found ' + f);
				continue;
			}
			app.error('Could not load ' + f, e);
		}
	}
	app.debug('Config object after loading files', config);

	return config;
}
