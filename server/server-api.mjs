
// Common
import Bus                                  from '../common/bus.js';
import contextualize                        from '../common/contextualize.js';
import loggerFactory                        from './server-logger.js';
import Scheduler                            from './server-scheduler.js';
import getConfig, * as configAPI            from './server-config.mjs';
import { getExpressApp }                    from './server-webserver.mjs';
import dispatchToBrowser                    from './server-client-dispatch.mjs';
export { rootDir }                          from './server-config.mjs';

const bus       = new Bus(loggerFactory('core:server:bus'));
const scheduler = new Scheduler(bus);

export const mockableAPI = {
	getConfig:               (...args)                                  => getConfig(...args),

	dispatchToBrowser:       (...args)                                  => dispatchToBrowser(...args),
	dispatch:                (eventName, data)                          => bus.dispatch(eventName, data),
	subscribe:               (eventName, cb)                            => bus.subscribe(eventName, cb),
	loggerFactory:           (loggerName)                               => loggerFactory(loggerName + ':server'),
	addSchedule:             (eventName, cron, duration = 0, data = {}) => scheduler.addCron(eventName, cron, duration, data),

	getExpressApp:           ()                                         => getExpressApp(),

	testingConfigOverride:   (newConfig)                                => configAPI.testingConfigOverride(newConfig),
	testingConfigRestore:    ()                                         => configAPI.testingConfigRestore(),
};

export default function inContext(context) {
	const c = contextualize(context);
	const logger = mockableAPI.loggerFactory(context);

	return {
		// TODO: remove logger from public api
		logger,
		getConfig:              (opath, def)                            => mockableAPI.getConfig(c(opath), def),

		dispatchToBrowser:      (eventName, msg)                        => mockableAPI.dispatchToBrowser(c(eventName), msg),
		dispatch:               (eventName, msg)                        => mockableAPI.dispatch(c(eventName), msg),
		subscribe:              (eventName, cb)                         => mockableAPI.subscribe(c(eventName), cb),
		addSchedule:            (signal, cron, duration = 0, data = {}) => mockableAPI.addSchedule(c(signal), cron, duration, data),
		error:                  (...data)                               => logger.error(...data),
		info:                   (...data)                               => logger.info(...data),
		debug:                  (...data)                               => logger.debug(...data),

		getChildLogger:         (name)                                  => logger.extend(name),
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
