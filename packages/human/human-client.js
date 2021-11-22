
import { ClientApp } from '../../client/client-app.js';
import Callback from '../../common/callback.js';

const app = new ClientApp('human');
const body = document.querySelector('body');

//
//
// DEBUG
//
//

export const debugActiveStatus = new Callback();

debugActiveStatus.onChange((debugActive) => {
	if (debugActive) {
		app.debug('Activating debug');
		body.removeAttribute('nodebug');
	} else {
		app.debug('Removing debug');
		body.setAttribute('nodebug', 'nodebug');
	}
});

let debugHook = null;
window.addEventListener('contextmenu', () => {
	// TODO: debug hook
	if (debugHook) {
		clearTimeout(debugHook);
	}
	debugHook = setTimeout(() => {
		debugActiveStatus.emit(false);
	}, 5 * 1000);
	debugActiveStatus.emit(true);
});

// initialize
debugActiveStatus.emit(false);


//
//
// ACTIVITY
//
//

export const humanActiveStatus = new Callback();

/**
 * @param {boolean} activity to be set (true if current activity)
 */
function setActivity(activity = true) {
	humanActiveStatus.emit(activity);
	if (activity) {
		if (body.hasAttribute('inactive')) {
			app.debug('Activity up');
			body.removeAttribute('inactive');
		}
	} else {
		if (!body.hasAttribute('inactive')) {
			app.debug('Activity down');
			body.setAttribute('inactive', 'inactive');
		}
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
		}, ((app.getServerState()?.config ?? [])['inactivitySeconds'] ?? 60) * 1000);
	}
});
