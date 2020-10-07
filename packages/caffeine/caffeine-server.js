
const { spawn } = require('child_process');

const serverAPIFactory = require('../../server/server-api.js');
const app = serverAPIFactory('caffeine');

const config = {
	cron: '* 6-22 * * *',
	user: 'pi',
	...app.getConfig()
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
			app.error('Caffeine launch error returned: ', err);
			return reject(-1);
		});
		cp.on('exit', (code) => {
			if (code == 0) {
				app.dispatchToBrowser('.wakeup');
				return resolve();
			}
			cp.stderr.setEncoding('UTF8');
			cp.stdout.setEncoding('UTF8');
			app.error('Caffeine return code non-zero: ', code, '# stderr: ', cp.stderr.read());
			return reject(code);
		});
	});
}

app.debug('Programming caffeine cron\'s ');
app.addSchedule('.wakeup', config.cron);

app.subscribe('.wakeup', wakeUp);
