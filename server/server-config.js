
const fs = require('fs');
const path = require('path');
const yargs = require('yargs');

const yaml = require('js-yaml');
const deepMerge  = require('deepmerge');
const objectPath = require('object-path');

const loggerFactory = require('./server-logger.js');
const logger = loggerFactory('core:server:config');

const rootDir = path.dirname(__dirname);

//
// Parameters
//

const configFiles = [
	// Later override earlier
	'etc/kiosk.yml'
];

if (typeof(jasmine) != 'undefined') {
	/* eslint-disable-next-line no-console */
	console.warn('Test mode: loading only tests/kiosk.yml');
	configFiles.length = 0;
	configFiles[0] = 'tests/kiosk.yml';
}

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
			alias: [ '-d', '--dev-mode' ],
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
// Load the configuration files
//

let config = {
	core: {
		root: rootDir
	}
};

//
// Setup some general configs
//

for(const i in configFiles) {
	const f = configFiles[i];
	try {
		logger.debug('Loading config file: ', f);
		let txt = fs.readFileSync(f, 'utf8');
		if (txt) {
			const doc = yaml.safeLoad(txt);
			config = deepMerge(config, doc);
			logger.info('Loaded config file ' + f);
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

//
// Override with command line options
//
if (cmdLineOptions.devMode) {
	if (!('browser' in config.core)) {
		config.core.browser = {};
	}
	config.core.browser.console = true;
}

logger.debug('Final config: ', config);

//
// Activate some loggers
//
if (config.core.loggers) {
	for(const re of config.core.loggers) {
		logger.info('Enabling logging level due to configuration: ', re);
		loggerFactory.enableDebugForRegexp(re);
	}
}

//
// Main function to get a config
//
const getConfigLogger = logger.extend('get');
module.exports = function getConfig(path = false, def = undefined) {
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

//
// for testing purposes
//

let configTestBackup = false;
function testingConfigOverride(configOverride) {
	if (configTestBackup !== false) {
		throw 'testingConfigOverride could not be called twice, please restore config before with testingConfigRestore()';
	}
	configTestBackup = config;
	config = configOverride;
}
module.exports.testingConfigOverride = testingConfigOverride;

function testingConfigRestore() {
	if (configTestBackup === false) {
		throw 'testingConfigRestore called when no backup was present. Please override first with testingConfigOverride(<config object>)';
	}
	config = configTestBackup;
	configTestBackup = false;
}
module.exports.testingConfigRestore = testingConfigRestore;

module.exports.rootDir = rootDir;
