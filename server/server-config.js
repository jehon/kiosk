
const fs = require('fs');
const path = require('path');
const yargs = require('yargs');

const yaml = require('js-yaml');
const deepMerge = require('deepmerge');
const objectPath = require('object-path');

const loggerFactory = require('./server-logger.js');
const logger = loggerFactory('server:config');
const rootDir = path.dirname(__dirname);

//
// Parameters
//

const configFiles = [
	// Later override earlier
	'etc/kiosk.yml'
];

//
// Default config
//
let config = {
	server: {
		devMode: false,
		root: rootDir
	}
};

if (typeof (jasmine) != 'undefined') {
	console.warn('Test mode: loading only tests/kiosk.yml');
	configFiles.length = 0;
	configFiles[0] = 'tests/kiosk.yml';
} else {

	//
	// Parse command lines
	//   it could add some configuration files
	//

	const cmdLineOptions = yargs
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
		.recommendCommands()
		.strict()
		.argv;

	logger.debug('Command line parsed options: ', cmdLineOptions);
	//
	// Load all the files
	//
	if (cmdLineOptions.file) {
		logger.debug('Adding configuration file at the end:', cmdLineOptions.file);
		configFiles.unshift(cmdLineOptions.file);
	}

	//
	// Override with command line options
	//
	if (cmdLineOptions.devMode) {
		config.server.devMode = true;
		logger.debug('Versions', process.versions);
		logger.info('Node version: ', process.versions['node']);
		logger.info('Chrome version: ', process.versions['chrome']);
	}

}

//
// Setup some general configs
//

for (const i in configFiles) {
	const f = configFiles[i];
	try {
		logger.debug('Loading config file: ', f);
		let txt = fs.readFileSync(f, 'utf8');
		if (txt) {
			const doc = yaml.safeLoad(txt);
			config = deepMerge(config, doc);
			logger.debug('Loaded config file ' + f);
			break;
		}
		logger.error('Skipping empty config file ' + f);
	} catch (e) {
		if (e && e.code == 'ENOENT') {
			logger.debug('Config file not found ' + f);
			continue;
		}
		logger.error('Could not load ' + f, e);
	}
}
logger.debug('Config object after loading files', config);

logger.debug('Final config: ', config);

//
// Activate some loggers
//
if (config.server.loggers) {
	for (const re of config.server.loggers) {
		logger.debug('Enabling logging level due to configuration: ', re);
		loggerFactory.enableDebugForRegexp(re);
	}
}

//
// Main function to get a config
//
const getConfigLogger = logger.extend('get');

/**
 *
 * @param {string} path the key path (dot separated)
 * @param {*} [def] the default value in case the value is not found
 * @returns {*} the value or the object
 */
module.exports = function getConfig(path = '', def = undefined) {
	if (path) {
		if (objectPath.has(config, path)) {
			const val = objectPath.get(config, path);
			getConfigLogger.debug(`Getting ${path} for defined value`, val);
			return val;
		}
		getConfigLogger.debug(`Getting ${path} for default value`, def);
		return def;
	}
	getConfigLogger.debug('Getting all config');
	return JSON.parse(JSON.stringify(config));
};

module.exports.set = function (path, val) {
	objectPath.set(config, path, val);
};

//
// for testing purposes
//

let configTestBackup = false;
/**
 * @param configOverride
 */
function testingConfigOverride(configOverride) {
	if (configTestBackup !== false) {
		throw 'testingConfigOverride could not be called twice, please restore config before with testingConfigRestore()';
	}
	configTestBackup = config;
	config = configOverride;
}
module.exports.testingConfigOverride = testingConfigOverride;

/**
 *
 */
function testingConfigRestore() {
	if (configTestBackup === false) {
		throw 'testingConfigRestore called when no backup was present. Please override first with testingConfigOverride(<config object>)';
	}
	config = configTestBackup;
	configTestBackup = false;
}
module.exports.testingConfigRestore = testingConfigRestore;

module.exports.rootDir = rootDir;
