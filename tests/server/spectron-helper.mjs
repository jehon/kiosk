
// https://electronjs.org/spectron

import Spectron from 'spectron';

const spectronApp = new Spectron.Application({
	path: '../../main.js'
});

export default spectronApp;
