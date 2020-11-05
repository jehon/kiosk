
/**
 * @param {string} url
 * @returns {string} test name
 */
export function fn(url) {
	return new URL(url).pathname.split('/').pop();
}
