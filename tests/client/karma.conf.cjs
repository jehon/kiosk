
const path = require('path');

/**
 * @param {object} config as the basis
 */
module.exports = function (config) {
	config.set({
		// logLevel: config.LOG_DEBUG,

		// base path that will be used to resolve all patterns (eg. files, exclude)
		basePath: path.join(__dirname, '../../'),

		frameworks: [
			'jasmine'
		],

		files: [
			{ pattern: 'tests/client/*-test.js', type: 'module' },
			{ pattern: 'tests/client/*.js', watched: true, included: false },
			{ pattern: 'client/*.js', watched: true, included: false },
			{ pattern: 'packages/**/*.js', watched: true, included: false },
			{ pattern: '**/*', watched: false, included: false },
		],

		// list of files / patterns to exclude
		exclude: [],

		// preprocess matching files before serving them to the browser
		// available preprocessors: https://npmjs.org/browse/keyword/karma-preprocessor
		preprocessors: {},

		// test results reporter to use
		// possible values: 'dots', 'progress'
		// available reporters: https://npmjs.org/browse/keyword/karma-reporter
		reporters: ['progress'],

		// web server port
		port: 9876,

		// enable / disable colors in the output (reporters and logs)
		colors: true,

		// enable / disable watching file and executing tests whenever any file changes
		autoWatch: true,

		// start these browsers
		// available browser launchers: https://npmjs.org/browse/keyword/karma-launcher
		browsers: ['ChromeHeadless'],
	});
};
