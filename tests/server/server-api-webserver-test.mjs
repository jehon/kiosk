
import fetch from '../../node_modules/node-fetch/lib/index.js';
import EventSource from '../../node_modules/eventsource/lib/eventsource.js';

import { start as startServer, stop as stopServer } from '../../server/server-api-webserver.mjs';
import serverAPIFactory from '../../server/server-api.mjs';
const serverAPI = serverAPIFactory('server-api-browser-test');

const serverUrl = (url) => `http://localhost:${port}${url}`;

function serverFetch(url, ...args) {
	return fetch(serverUrl(url), ...args);
}

let port = 0;

describeHere(() => {
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

	describe('with sse', function() {
		it('should publish events to the browser', (done) => {
			const evtName = 'browser-test';
			const es = new EventSource(serverUrl('/core/events'));
			es.onerror = function (err) {
				done.fail('SSE thrown an error: ', err);
			};
			es.addEventListener('message', function (msgEvent) {
				const obj = JSON.parse(msgEvent.data);
				if (obj.type != evtName) {
					return;
				}

				expect(obj.type).toBe(evtName);
				expect(obj.data).toBe('hello world');
				done();
			});
			es.on('open', () => {
				serverAPI.dispatchToBrowser(evtName, 'hello world');
			});
		});

		it('should fire last known status at connection', (done) => {
			const evtName = 'browser-test-statefull';
			serverAPI.dispatchToBrowser(evtName, 'hello world 2');

			const es = new EventSource(serverUrl('/core/events'));
			es.onerror = function (err) {
				done.fail('SSE thrown an error: ', err);
			};

			es.addEventListener('message', function (msgEvent) {
				const obj = JSON.parse(msgEvent.data);
				if (obj.type != evtName) {
					return;
				}
				expect(obj.type).toBe(evtName);
				expect(obj.data).toBe('hello world 2');
				done();
			});
		});
	});
});
