
import path from 'path';

import {
	INDEX_FILENAME,
	init,
	loadList
} from '../../packages/photo-frame/photo-frame-server.mjs';
import getConfig, { setConfig } from '../../server/server-lib-config.js';

import { fn } from './helper-main.js';

const testFolderConfig = {
	'folder': 'tests/server/data/photos',
};

describe(fn(import.meta.url), () => {
	let beforeConfig = {};
	beforeAll(() => {
		beforeConfig = getConfig('');
	});

	beforeEach(() => {
		setConfig('photo-frame', JSON.parse(JSON.stringify(testFolderConfig)));
	});

	afterAll(() => {
		setConfig('', beforeConfig);
	});

	it('should init', async function () {
		expect(init()).toBeDefined();
	});

	it('should handle when no files are found', async () => {
		const data = await loadList('tests/does_not_exists');
		expect(data.length).toBe(0);
	});

	it('should get the content', async function () {
		const data = await loadList(path.join('tests/server/data/photos/', INDEX_FILENAME));

		expect(data.length).toBe(7);

		const d0 = data[0];
		expect(d0.originalFilePath).toBe('photo-frame/f2/m3.jpg');
		expect(d0.data.title).toBe('');
		expect(d0.data.date).toBe('');
		expect(d0.data.orientation).toBe(0);
	});
});
