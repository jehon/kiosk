
import AppFactory from '../../client/client-app.js';

const app = AppFactory('caffeine');
const body = document.querySelector('body');

/**
 * @param {boolean} activity to be set (true if current activity)
 */
function setActivity(activity = true) {
	if (activity) {
		app.debug('Activity up');
		body.removeAttribute('inactive');

		// TODO: other hook
		body.removeAttribute('nodebug');
	} else {
		app.debug('Activity down');
		body.setAttribute('inactive', 'inactive');

		// TODO: other hook
		body.setAttribute('nodebug', 'activity');
	}
}

// Initialize to false
setActivity(false);

let eraser = false;

const lastPosition = {};
memorizePosition(new MouseEvent(''));

/**
 * @param e
 */
function memorizePosition(e) {
	lastPosition.x = e.clientX;
	lastPosition.y = e.clientY;
	lastPosition.time = new Date();
}

body.addEventListener('mousemove', e => {
	const now = new Date();
	if (now - lastPosition.time > 1000) {
		// Last position is too old, let's start again
		app.debug('Reset position');
		memorizePosition(e);
	}

	const dist2 = Math.pow(e.clientX - lastPosition.x, 2)
		+ Math.pow(e.clientY - lastPosition.y, 2);

	// A big movement in a short time, it's an activity
	if (dist2 > Math.pow(50, 2)) {
		setActivity();

		// Reprogram the 'down' activity
		clearTimeout(eraser);
		eraser = setTimeout(() => {
			clearTimeout(eraser);
			eraser = false;
			setActivity(false);
		}, 5 * 1000);
	}
});
