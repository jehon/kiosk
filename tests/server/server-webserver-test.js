
const fetch = require('../../node_modules/node-fetch/lib/index.js');

const { start: startServer, stop: stopServer } = require('../../server/server-webserver.js');

const serverUrl = (url) => `http://localhost:${port}${url}`;

function serverFetch(url, ...args) {
	return fetch(serverUrl(url), ...args);
}

let port = 0;

describe(__filename, () => {
	beforeAll(async () => {
		port = await startServer(0);
	});

	afterAll(() => {
		stopServer();
	});

	describe('for basic routing', function() {
		it('should start the server', () => {
			expect(port > 0).toBeTruthy();
		});

		it('should serve client files', async () => {
			await serverFetch('/client/favicon.svg').then(response => {
				expect(response.ok).toBeTruthy();
			});
		});

		it('should serve node_modules', async () => {
			await serverFetch('/node_modules/express/index.js').then(response => {
				expect(response.ok).toBeTruthy();
			});
		});
	});

});
