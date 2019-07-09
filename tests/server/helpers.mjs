
import { mockableAPI } from '../../server/server-api.mjs';

export async function expectBrowserEvent(eventName, when, cb) {
	if (mockableAPI.dispatchToBrowser.calls) {
		mockableAPI.dispatchToBrowser.calls.reset();
	} else {
		spyOn(mockableAPI, 'dispatchToBrowser').and.callThrough();
	}
	await when();
	const res = [];
	const c = mockableAPI.dispatchToBrowser.calls.argsFor;
	for(let i = 0; i < mockableAPI.dispatchToBrowser.calls.argsFor.length; i++) {
		if (c(i)[0] == eventName) {
			res.push(c(i)[1]);
		}
	}
	return res;
}
