// Karma configuration

// ???
// process.env.CHROME_BIN = require('puppeteer').executablePath();

module.exports = function (config) {
	config.set({
		// logLevel: config.LOG_DEBUG,

		// base path that will be used to resolve all patterns (eg. files, exclude)
		basePath: __dirname + '/../../',

		// frameworks to use
		// available frameworks: https://npmjs.org/browse/keyword/karma-adapter
		frameworks: [
			'jasmine',
			'jasmine-html'
		],

		// list of files / patterns to load in the browser
		// @see https://karma-runner.github.io/3.0/config/files.html
		files: [
			{ pattern: 'tests/client/**/*.js', type: 'module' },
			{ pattern: '**/node_modules/**/*', watched: false, included: false, served: true },
			{ pattern: 'client/*.js',          watched: true,  included: false, served: true },
			{ pattern: '**/*', 		           watched: false, included: false, served: true },
		],

		// list of files / patterns to exclude
		exclude: [],

		// preprocess matching files before serving them to the browser
		// available preprocessors: https://npmjs.org/browse/keyword/karma-preprocessor
		preprocessors: {},

		// test results reporter to use
		// possible values: 'dots', 'progress'
		// available reporters: https://npmjs.org/browse/keyword/karma-reporter
		reporters: [ 'progress' ],

		// web server port
		port: 9876,

		// enable / disable colors in the output (reporters and logs)
		colors: true,

		// level of logging
		// possible values: config.LOG_DISABLE || config.LOG_ERROR || config.LOG_WARN || config.LOG_INFO || config.LOG_DEBUG
		// logLevel: config.LOG_INFO,


		// enable / disable watching file and executing tests whenever any file changes
		autoWatch: true,


		// start these browsers
		// available browser launchers: https://npmjs.org/browse/keyword/karma-launcher
		// browsers: [ 'ChromiumHeadless' ],
		browsers: [ 'ChromiumHeadless' ],


		// Continuous Integration mode
		// if true, Karma captures browsers, runs the tests and exits
		singleRun: false,


		// Concurrency level
		// how many browser should be started simultaneous
		concurrency: Infinity
	});
};
