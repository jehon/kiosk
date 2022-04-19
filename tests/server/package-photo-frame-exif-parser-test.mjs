
import exifParser from '../../packages/photo-frame/exif-parser.mjs';

import { fn } from './helper-main.mjs';

describe(fn(import.meta.url), () => {
	it('should parse file infos on f1', async () => {
		const data = await exifParser('tests/server/data/photo-frame/f1/i1.png');
		expect(data['title']).not.toBeUndefined();
		expect(data['title']).toBe('Test title here');

		expect(data['date']).not.toBeUndefined();
		expect(data['date']).toEqual('2019-07-01 02:03:04');
	});

	it('should not fail when no data is present', async () => {
		const data = await exifParser('tests/server/data/photo-frame/f1/i2.jpg');

		expect(data['title']).toBe('');
		expect(data['date']).toBe('');
	});
});
