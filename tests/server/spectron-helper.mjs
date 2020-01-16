
// https://electronjs.org/spectron

const Application = require('spectron').Application;
const spectronApp = new Application({
	path: '../../main.js'
});

export default spectronApp;
