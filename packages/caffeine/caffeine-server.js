
import { exec } from 'child_process';
import { promisify } from 'util';

import serverAPIFactory from '../../server/server-api.mjs';
const serverAPI = serverAPIFactory('caffeine');

const logger = serverAPI.logger;

const config = {
	cron: '*/5 7-22 * * *',
	user: 'pi',
	...serverAPI.getConfig()
};

async function wakeUp() {
	const cmdLine = 'runuser -u pi -- /usr/bin/xdotool mousemove_relative 1 1 mousemove_relative -- -1 -1';

	// Handle return code and errors
	try {
		await promisify(exec)(cmdLine, {
			stdio: [ 'ignore', null, null ],
			env: {
				'DISPLAY': ':0'
			}
		});
		serverAPI.dispatchToBrowser('.wakeup');
	} catch (e) {
		logger.trace('Caffeine error returned: ', e.code, '##', e.stdout, e.stderr);
	}
}

logger.trace('Programming caffeine cron\'s ');
serverAPI.addSchedule('.wakeup', config.cron);

serverAPI.subscribe('.wakeup', wakeUp);
