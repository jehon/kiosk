
import { ServerAPI } from '../../server/server-api.mjs';

// Eventname is the shortname, because it is the way it was called
// from the class, outside of any context
export async function expectBrowserEvent(eventName, testFn) {
	if (ServerAPI.prototype.dispatchToBrowser.calls) {
		ServerAPI.prototype.dispatchToBrowser.calls.reset();
	} else {
		spyOn(ServerAPI.prototype, 'dispatchToBrowser').and.callThrough();
	}
	await testFn();
	const res = [];
	const c = ServerAPI.prototype.dispatchToBrowser.calls.argsFor;
	for(let i = 0; i < ServerAPI.prototype.dispatchToBrowser.calls.argsFor.length; i++) {
		if (c(i)[0] == eventName) {
			res.push(c(i)[1]);
		}
	}
	return res;
}
