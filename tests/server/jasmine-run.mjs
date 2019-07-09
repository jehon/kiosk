
// See https://stackoverflow.com/a/47835049/1954789

import glob from 'glob';
import Jasmine from 'jasmine';
import '../../node_modules/colors/lib/index.js';

import { getModuleBasename } from '../../common/esm-polyfill.js';

// Configure default logger
import loggerFactory, { setGlobalLevel } from '../../common/logger.js';
const logger = loggerFactory('jasmine');
setGlobalLevel('DEBUG');
// setGlobalLevel('TRACE');

const jasmine = new Jasmine();
jasmine.loadConfigFile( './tests/server/jasmine.json' );

// Export to global scope
global.describeHere = (fn) => {
	return describe(getModuleBasename(1), fn);
};

global.fdescribeHere = (fn) => {
	return fdescribe(getModuleBasename(1), fn);
};

global.xdescribeHere = (fn) => {
	return xdescribe(getModuleBasename(1), fn);
};

jasmine.jasmine.clock().install();
jasmine.jasmine.clock().mockDate(new Date(2019, 1, 1, 12, 0, 0));
logger.info('Mocking date to ', new Date());

afterAll(() => {
	jasmine.jasmine.clock().uninstall();
});

// Load mjs specs
glob('**/*-test.mjs', function (er, files) {
	Promise.all(
		files
			.map(f => f.replace('tests/server/', './'))
			.map(f => import(f)
				.catch(e => {
					console.error('jasmine-run: error loading', f, ': ', e);
					process.exit(1);
				}))
	)
		.then(() => jasmine.execute());
});
