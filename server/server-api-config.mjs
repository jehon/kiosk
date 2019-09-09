
import fs from 'fs';
import path from 'path';
import yargs from 'yargs';
import url from 'url';

import yaml from 'js-yaml';
import deepMerge  from 'deepmerge';
import objectPath from 'object-path';

import loggerFactory, { debugModule } from '../common/logger.js';
const logger = loggerFactory('core.config');


export const rootDir = path.dirname(path.dirname(url.fileURLToPath(import.meta.url)));

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
		'dev': {
			alias: 'd',
			describe: 'In dev mode, some functionnalities are disabled.',
			type: 'boolean',
			default: false
		},
		'port': {
			alias: 'p',
			type: 'integer',
			describe: 'The port to listen to',
			default: 0
		},
		'file': {
			alias: 'f',
			type: 'string',
			describe: 'additionnal file configuration'
		},
		'server-only': {
			type: 'boolean',
			describe: 'start only the server, not the browser'
		}
	})
	.help()
	.recommendCommands()
	.strict()
	.argv;

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
		root: rootDir,
		port: 3000
	}
};


//
// Command line options (only from command-line)
//
if (cmdLineOptions.dev) {
	config.core.dev   = cmdLineOptions.dev;
}
if (cmdLineOptions._) {
	config._ = cmdLineOptions._;
}
config.cmdLine = cmdLineOptions;
logger.debug('Command line parsed options: ', config);

//
// Setup some general configs
//

if (config.core.dev) {
	debugModule('*');
	logger.info('Started in dev mode');
}


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
if (cmdLineOptions.port > 0) {
	config.core.port  = cmdLineOptions.port;
}

logger.debug('Final config: ', config);

//
// Main function to get a config
//

export default function getConfig(path = false, def = undefined) {
	if (path) {
		if (objectPath.has(config, path)) {
			return objectPath.get(config, path);
		}
		return def;
	}
	return JSON.parse(JSON.stringify(config));
}

//
// for testing purposes
//

let configTestBackup = false;
export function testingConfigOverride(configOverride) {
	if (configTestBackup !== false) {
		throw 'testingConfigOverride could not be called twice, please restore config before with testingConfigRestore()';
	}
	configTestBackup = config;
	config = configOverride;
}

export function testingConfigRestore() {
	if (configTestBackup === false) {
		throw 'testingConfigRestore called when no backup was present. Please override first with testingConfigOverride(<config object>)';
	}
	config = configTestBackup;
	configTestBackup = false;
}
