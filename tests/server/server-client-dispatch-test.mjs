
import EventSource from '../../node_modules/eventsource/lib/eventsource.js';

import { start as startServer, stop as stopServer } from '../../server/server-webserver.mjs';
import serverAPIFactory from '../../server/server-api.mjs';
const app = serverAPIFactory('server-client-browser:test');

const serverUrl = (url) => `http://localhost:${port}${url}`;

let port = 0;

describe(import.meta.url, () => {
	beforeAll(async () => {
		port = await startServer(0);
	});

	afterAll(() => {
		stopServer();
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
				app.dispatchToBrowser(evtName, 'hello world');
			});
		});

		it('should fire last known status at connection', (done) => {
			const evtName = 'browser-test-statefull';
			app.dispatchToBrowser(evtName, 'hello world 2');

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
