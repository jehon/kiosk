
import { ClientApp } from '../../client/client-app.js';

const app = new ClientApp('caffeine');
const body = document.querySelector('body');

let debugHook = null;
window.addEventListener('contextmenu', () => {
	// TODO: debug hook
	if (debugHook) {
		clearTimeout(debugHook);
	}
	debugHook = setTimeout(() => {
		app.debug('Removing debug');
		body.setAttribute('nodebug', 'right-click');

	}, 5 * 1000);
	app.debug('Activating debug');
	body.removeAttribute('nodebug');
});

/**
 * @param {boolean} activity to be set (true if current activity)
 */
function setActivity(activity = true) {
	if (activity) {
		app.debug('Activity up');
		body.removeAttribute('inactive');
	} else {
		app.debug('Activity down');
		body.setAttribute('inactive', 'inactive');
	}
}

// Initialize to false
setActivity(false);

let eraser = null;

/**
 * @type {object} to remember mouse position
 * @property {number} x where it happened
 * @property {number} y where it happened
 * @property {Date} time when it happened
 */
const lastPosition = {};
memorizePosition(new MouseEvent(''));

/**
 * @param {MouseEvent} e to be memorized
 */
function memorizePosition(e) {
	lastPosition.x = e.clientX;
	lastPosition.y = e.clientY;
	lastPosition.time = new Date();
}

body.addEventListener('mousemove', e => {
	const now = new Date();
	if ((now.getTime() - lastPosition.time.getTime()) > 1000) {
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
