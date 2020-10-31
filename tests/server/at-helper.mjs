
/**
 * Count the number of included files
 */
export let fnCnt = 0;

/**
 * @param {string} url - import.meta.url
 * @returns {string} the filename as a test title
 */
export function fn(url) {
	fnCnt++;
	return new URL(url).pathname.split('/').pop();
}

// afterAll(function () {
// 	expect(fnCnt)
// 		.withContext('#FILE_NUMBER# Number of files in athelper.js')
// 		.toBe(36);
// });

