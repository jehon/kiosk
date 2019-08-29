
import { spawn } from 'child_process';

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
	return new Promise((resolve, reject) => {
		const cp = spawn('/usr/bin/xdotool',
			[ 'mousemove_relative', '1', '1', 'mousemove_relative', '--', '-1',  '-1' ],
			{
				stdio: [ 'ignore', 'inherit', 'inherit' ],
				env: {
					'DISPLAY': ':0'
				}
			});
		cp.on('error', err => {
			logger.error('Caffeine launch error returned: ', err);
			return reject(-1);
		});
		cp.on('exit', (code) => {
			if (code == 0) {
				serverAPI.dispatchToBrowser('.wakeup');
				return resolve();
			}
			cp.stderr.setEncoding('UTF8');
			cp.stdout.setEncoding('UTF8');
			logger.error('Caffeine return code non-zero: ', code, '# stderr: ', cp.stderr.read());
			return reject(code);
		});
	});
}

logger.debug('Programming caffeine cron\'s ');
serverAPI.addSchedule('.wakeup', config.cron);

serverAPI.subscribe('.wakeup', wakeUp);
