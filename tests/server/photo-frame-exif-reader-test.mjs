
import exifParser from '../../packages/photo-frame/exif-parser.js';

describeHere(() => {
	it('should parse file infos on f1', async () => {
		const data = await exifParser('tests/server/data/photo-frame/f1/i1.png');
		expect(data['comment']).not.toBeUndefined();
		expect(data['comment']).toBe('Test comment here');

		expect(data['date']).not.toBeUndefined();
		expect(data['date']).toEqual(new Date(2019, 6, 1, 2, 3, 4));
	});

	it('should not fail when no data is present', async () => {
		const data = await exifParser('tests/server/data/photo-frame/f1/i2.jpg');

		expect(data['comment']).toBe('');
		expect(data['date']).toBeNull();
	});
});
