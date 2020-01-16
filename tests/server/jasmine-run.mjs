
// See https://stackoverflow.com/a/47835049/1954789

import path from 'path';

import Jasmine from 'jasmine';
import '../../node_modules/colors/lib/index.js';

// Configure default logger
import loggerFactory from '../../server/server-logger.js';
const logger = loggerFactory('jasmine');

const jasmine = new Jasmine({ projectBaseDir: path.resolve() });

jasmine.loadConfigFile( './tests/server/jasmine.json' );
if (process.argv.length > 2) {
	jasmine.specFiles = process.argv.slice(2)
		.map(f => path.join(process.cwd(), f));
}

// Mocking the time

jasmine.jasmine.clock().install();
jasmine.jasmine.clock().mockDate(new Date(2019, 1, 1, 12, 0, 0));
logger.info('Mocking date to ', new Date());

afterAll(() => {
	jasmine.jasmine.clock().uninstall();
});

// Starting the App

import Spectron from 'spectron';

const spectronApp = new Spectron.Application({
	path: './main.js'
});

console.log('Starting spectron app ???');
spectronApp.start({ path: path.join(process.cwd(), 'node_modules/.bin/electron')  })
	.then(() => {
		console.log('started');
	})
	.then(() => {
		afterAll(async () => spectronApp.stop());

		// Load mjs specs
		Promise.all(
			jasmine.specFiles.filter(f => f.endsWith('.mjs')).map(f => {
				f = f.replace(path.join(process.cwd(), 'tests/server/'), './');
				// console.log('MJS: ', f);
				return import(f)
					.catch(e => {
						console.error('jasmine-run: error loading', f, ': ', e);
						process.exit(1);
					});
			})
		).then(() => {
			jasmine.specFiles = jasmine.specFiles.filter(f => f.endsWith('.js'));

			console.log('JS: ', jasmine.specFiles);
			jasmine.execute();
		});
	})
	.catch(e => console.error(e));
