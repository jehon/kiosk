
// Colors for the process logger
import '../node_modules/colors/lib/index.js';

// Common
import Bus from '../common/bus.js';
import contextualize from '../common/contextualize.js';
import loggerFactory from '../common/logger.js';
import Scheduler from './scheduler.js';
export { rootDir } from './server-api-config.mjs';

// Server
import getConfig, * as configAPI from './server-api-config.mjs';
import { getExpressApp, dispatchToBrowser } from './server-api-webserver.mjs';

// process.on('unhandledRejection', (reason, promise) => {
// 	console.log('hehehe: unhandled rejection error ?');
// 	console.error(`${reason.message} (from: ${reason.name} ${reason.code} #${reason.errno}: ${reason.syscall}() for ${reason.path} )`);
// 	console.error(reason.stack);
// 	// console.error(reason.errno, reason.code, reason.syscall, reason.path);
// 	throw(reason);
// 	// console.log(typeof(reason), typeof(promise));
// 	// console.log(Object.keys(reason), Object.keys(promise));
// 	// console.log(promise);
// 	// console.log(reason);
// 	// console.log('Unhandled Rejection at:', promise, 'reason:', reason);
// });

const logger = loggerFactory('server');
const bus = new Bus(logger);
const scheduler = new Scheduler((signal, data) => bus.dispatch(signal, data), logger);

export const mockableAPI = {
	getConfig:               (...args)                               => getConfig(...args),

	dispatchToBrowser:       (...args)                               => dispatchToBrowser(...args),
	dispatch:                (eventName, data)                       => bus.dispatch(eventName, data),
	subscribe:               (eventName, cb)                         => bus.subscribe(eventName, cb),
	loggerFactory:           (loggerName)                            => loggerFactory(loggerName, 'server'),
	addSchedule:             (signal, cron, duration = 0, data = {}) => scheduler.addCron(signal, cron, duration, data),

	getExpressApp:           ()                                      => getExpressApp(),

	testingConfigOverride:   (newConfig)                             => configAPI.testingConfigOverride(newConfig),
	testingConfigRestore:    ()                                      => configAPI.testingConfigRestore(),
};

export default function inContext(context) {
	// const c = ctxForFunction(context);
	const c = contextualize(context);

	return {
		logger:                 mockableAPI.loggerFactory(context),
		getConfig:              (opath, def)                            => mockableAPI.getConfig(c(opath), def),

		dispatchToBrowser:      (eventName, msg)                        => mockableAPI.dispatchToBrowser(c(eventName), msg),
		dispatch:               (eventName, msg)                        => mockableAPI.dispatch(c(eventName), msg),
		subscribe:              (eventName, cb)                         => mockableAPI.subscribe(c(eventName), cb),
		addSchedule:            (signal, cron, duration = 0, data = {}) => mockableAPI.addSchedule(c(signal), cron, duration, data),


		// TODO: https://expressjs.com/en/api.html#req
		// var greet = express.Router();

		// greet.get('/jp', function (req, res) {
		//   console.log(req.baseUrl); // /greet
		//   res.send('Konichiwa!');
		// });

		// app.use('/greet', greet); // load the router on '/greet'

		getExpressApp:          ()                                      => mockableAPI.getExpressApp(),
	};
}
