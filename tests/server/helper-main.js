
/**
 * Count the number of included files
 *
 * @type {number}
 */
export let fnCnt = 0;

/**
 * @param {string} url is import.meta.url
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

import { dirname } from 'path';
import { fileURLToPath } from 'url';
export const __dirname = dirname(fileURLToPath(import.meta.url));

/**
 * @param {number} ms to wait
 * @returns {Promise<void>} resolve after ms milliseconds
 */
export async function waitMillis(ms) {
  return new Promise(resolve => {
    setTimeout(() => resolve(), ms);
  });
}
