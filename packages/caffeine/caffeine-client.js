
import AppFactory from '../../client/client-api.js';

const app = AppFactory('caffeine');

// Initialize to false
app.dispatch('.activity', false);

let eraser = false;

const lastPosition = {};
memorizePosition(new MouseEvent(''));

function memorizePosition(e) {
	lastPosition.x = e.clientX;
	lastPosition.y = e.clientY;
	lastPosition.time = new Date();
}

// TODO: debug
const body = document.querySelector('body');

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
		app.debug('Activity up');
		app.dispatch('.activity', true);

		// Reprogram the 'down' activity
		clearTimeout(eraser);
		eraser = setTimeout(() => {
			clearTimeout(eraser);
			eraser = false;
			app.debug('Activity down');
			app.dispatch('.activity', false);
		}, 5 * 1000);
	}
});
