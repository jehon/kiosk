
const serverAPIFactory = require('../../server/server-api.js');
// import spectronApp from './spectron-helper.mjs';
const { ServerAPI } = serverAPIFactory;

// Eventname is the shortname, because it is the way it was called
// from the class, outside of any context
module.exports.expectBrowserEvent = async function (eventName, testFn) {
	if (ServerAPI.prototype.dispatchToBrowser.calls) {
		ServerAPI.prototype.dispatchToBrowser.calls.reset();
	} else {
		spyOn(ServerAPI.prototype, 'dispatchToBrowser').and.callThrough();
	}
	await testFn();
	const res = [];
	const c = ServerAPI.prototype.dispatchToBrowser.calls.argsFor;
	for (let i = 0; i < ServerAPI.prototype.dispatchToBrowser.calls.argsFor.length; i++) {
		if (c(i)[0] == eventName) {
			res.push(c(i));
		}
	}
	return res;
};
