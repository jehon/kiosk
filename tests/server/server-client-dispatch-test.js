
const EventSource = require('../../node_modules/eventsource/lib/eventsource.js');

const { start: startServer, stop: stopServer } = require('../../server/server-webserver.js');
const { serverAPIFactory } = require('../../server/server-api.js');
const app = serverAPIFactory('server-client-browser:test');

const serverUrl = (url) => `http://localhost:${port}${url}`;

let port = 0;

describe(__filename, () => {
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
