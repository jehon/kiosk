
import * as esm from '../../common/esm-polyfill.js';

describeHere(() => {
	it('should give the filename', () => {
		expect(esm.getModuleBasename()).toBe('esm-polyfill-test.mjs');
	});
});
