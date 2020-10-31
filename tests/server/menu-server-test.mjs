
import app, { init } from '../../packages/menu/menu-server.mjs';
import getConfig, { setConfig } from '../../server/server-lib-config.mjs';

import { fn } from './at-helper.mjs';

describe(fn(import.meta.url), () => {
	let cfg;
	beforeAll(() => {
		cfg = getConfig();
		setConfig('', {
			'menu': {
				'Meteo': {
					'priority': 5100,
					'url': 'http://www.meteo.be',
					'icon': 'http://www.meteo.be/meteo/html/2011/img/weather_klein/300.png',
					'label': 'Météo'
				},
				'BuienAlarm': {
					'priority': 5100,
					'url': 'https://www.drops.live/fr/ciney-wallonie-belgique/50.29565,5.10083',
					'icon': 'https://www.drops.live/favicon.ico',
					'label': 'Buien Alarm'
				}
			}
		});
	});

	afterAll(() => {
		setConfig('', cfg);
	});

	it('should set state', function () {
		init();
		expect(app.getState().Meteo).not.toBeFalsy();
	});
});
