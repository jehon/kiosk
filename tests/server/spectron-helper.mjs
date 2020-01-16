
// https://electronjs.org/spectron

import Spectron from 'spectron';

const spectronApp = new Spectron.Application({
	path: '../../main.js'
});

beforeAll(async () => {
	console.log('Starting spectron app');
	return spectronApp.start();
});
afterAll(async () => spectronApp.stop());


export default spectronApp;
