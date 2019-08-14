
import { spawn } from 'child_process';
import { promisify } from 'util';

import serverAPIFactory from '../../server/server-api.mjs';
const serverAPI = serverAPIFactory('caffeine');

const logger = serverAPI.logger;

const config = {
	cron: '* 7-22 * * *',
	user: 'pi',
	...serverAPI.getConfig()
};

async function wakeUp() {
	// Handle return code and errors
	try {
		await promisify(spawn)('/usr/bin/xdotool',
			[ 'mousemove_relative', '1', '1', 'mousemove_relative', '--', '-1',  '-1' ],
			{
				stdio: [ 'ignore', 'inherit', 'inherit' ],
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
