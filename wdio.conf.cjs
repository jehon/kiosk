
// Thanks to https://github.com/praveendvd/WebdriverIO_electronAppAutomation_boilerplate/blob/main/wdio.conf.js

const kill = require('kill-port');

const cdPort = 9515;
const cdPath = '/wd/hub';

exports.config = {
    // ====================
    // Runner Configuration
    // ====================
    runner: 'local',
    port: cdPort,
    path: cdPath,
    specs: [
        'tests/app/specs/**/*.*js'
    ],
    exclude: [
        // 'path/to/excluded/files'
    ],
    //
    // ============
    // Capabilities
    // ============
    maxInstances: 1,
    capabilities: [{
        maxInstances: 1,
        browserName: 'chrome',
        acceptInsecureCerts: true,
        'goog:chromeOptions': {
            binary: './node_modules/electron/dist/electron',
            args: ['app=' + __dirname]
        },
    }],

    onComplete: async function (exitCode, config, capabilities, results) {
        await kill(4723, 'tcp');
    },

    // ===================
    // Test Configurations
    // ===================

    // Level of logging verbosity: trace | debug | info | warn | error | silent
    logLevel: 'warn',

    // loggers:
    // - webdriver, webdriverio
    // - @wdio/browserstack-service, @wdio/devtools-service, @wdio/sauce-service
    // - @wdio/mocha-framework, @wdio/jasmine-framework
    // - @wdio/local-runner
    // - @wdio/sumologic-reporter
    // - @wdio/cli, @wdio/config, @wdio/utils
    // Level of logging verbosity: trace | debug | info | warn | error | silent
    // logLevels: {
    //     webdriver: 'debug',
    // },

    // baseUrl: 'http://localhost',
    waitforTimeout: 10000,
    connectionRetryTimeout: 120 * 1000,
    connectionRetryCount: 0,

    // Services take over a specific job you don't want to take care of. They enhance
    // your test setup with almost no effort. Unlike plugins, they don't add new
    // commands. Instead, they hook themselves up into the test process.
    services: [['chromedriver', {
        port: cdPort,
        path: cdPath,
        chromedriverCustomPath: './node_modules/electron-chromedriver/chromedriver.js'
    }]],

    // see also: https://webdriver.io/docs/frameworks
    framework: 'jasmine',
    reporters: ['spec'],

    //
    // Options to be passed to Jasmine.
    jasmineOpts: {
        // Jasmine default timeout
        defaultTimeoutInterval: 60 * 1000,
        //
        // The Jasmine framework allows interception of each assertion in order to log the state of the application
        // or website depending on the result. For example, it is pretty handy to take a screenshot every time
        // an assertion fails.
        expectationResultHandler: function (passed, assertion) {
            /**
             * only take screenshot if assertion failed
             */
            if (passed) {
                return;
            }

            browser.saveScreenshot(`assertionError_${assertion.error.message}.png`);
        }
    },
};

