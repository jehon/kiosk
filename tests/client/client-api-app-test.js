
import ClientAPI from '../../client/client-api-apps.js';

let app1 = new ClientAPI('test1')
	.withPriority(1);

describe('client app test', () => {
	it('should instanciate', () => {
		expect(app1).not.toBeNull();
	});
});
