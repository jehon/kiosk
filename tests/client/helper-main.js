
/**
 * @param {string} url is import.meta.url
 * @returns {string} test name
 */
export function fn(url) {
	return new URL(url).pathname.split('/').pop();
}

document.querySelector('body').insertAdjacentHTML('beforeend', '<div id="main-application"></div>');
