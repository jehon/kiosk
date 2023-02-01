
/**
 * @param {string} url is import.meta.url
 * @returns {string} test name
 */
export function fn(url) {
  return new URL(url).pathname.split('/').pop();
}

/**
 *
 * @param {object} options to wait for
 * @param {number} options.hours to wait for
 * @param {number} options.minutes to wait for
 * @param {number} options.seconds to wait for
 * @param {number} options.milliSeconds to wait for
 */
export function tick(options) {
  options = {
    hours: 0,
    minutes: 0,
    seconds: 0,
    milliSeconds: 0,
    ...options
  };
  jasmine.clock().tick((((options.hours * 60) + options.minutes) * 60 + options.seconds) * 1000 + options.milliSeconds);
}

document.querySelector('body').insertAdjacentHTML('beforeend', '<div id="main-application"></div>');
