
import ClientAppElement from '../../client/client-app-element.js';
import { ClientApp } from '../../client/client-app.js';
import { priorities } from '../../client/config.js';
import TimeInterval from '../../common/TimeInterval.js';

const app = new ClientApp('clock');

const circleRadius = 97;
const handLengths = {
	h: 55,
	m: 80,
	s: 89
};

/*
	See mathematics here:
	   x = horizontal left to right
	   y = vertical top to bottom

	   angle = clockwise (degrees), starting from horizontal to the right (from x to y axis)

	   See https://developer.mozilla.org/en-US/docs/Web/SVG/Tutorial/Positions
*/

/**
 * @param {number} hours 0..12
 * @returns {number} the angle (radian) correspondign to the hours
 */
const angleFromHours = hours => hours * (Math.PI * 2 / 12) - Math.PI / 2;
/**
 * @param {number} minutes 0..59
 * @returns {number} the angle (radian) correspondign to the minutes
 */
const angleFromMinutes = minutes => minutes * (Math.PI * 2 / 60) - Math.PI / 2;

/**
 * @param {number} minutes 0..59
 * @param {number} seconds 0..59
 * @returns {number} the angle (radian) correspondign to the seconds
 */
const angleFromMinutesSeconds = (minutes, seconds) => (angleFromMinutes(minutes) + (seconds * Math.PI * 2 / 60 / 60));

/**
 * @param {number} r polar radius
 * @param {number} theta polar angle (radian)
 * @returns {number} X axis
 */
const polar2cartesianX = (r, theta) => r * Math.cos(theta);
/**
 * @param {number} r polar radius
 * @param {number} theta polar angle (radian)
 * @returns {number} Y axis
 */
const polar2cartesianY = (r, theta) => r * Math.sin(theta);

/**
 *
 * @param {number} r is the radius
 * @param {number} theta is the angle (radian)
 * @returns {object} the coordonates
 * @property {number} x coordonate
 * @property {number} y coordonate
 */
const polar2cartesian = (r, theta) => ({ x: polar2cartesianX(r, theta), y: polar2cartesianY(r, theta) });

// Thanks to https://jsfiddle.net/upsidown/e6dx9oza/
/**
 * @param {number} radius polar radius
 * @param {number} startAngle (radian)
 * @param {number} endAngle (radian)
 * @returns {string} the SVG description of the arc
 */
function describeArc(radius, startAngle, endAngle) {
	const start = polar2cartesian(radius, endAngle);
	const end = polar2cartesian(radius, startAngle);

	// Normalize endAngle
	while (endAngle < startAngle) {
		endAngle += Math.PI * 2;
	}
	// If more than half a tour, take the large arc
	var largeArc = (endAngle > startAngle + Math.PI) ? 1 : 0;

	// https://developer.mozilla.org/en-US/docs/Web/SVG/Tutorial/Paths
	//  A rx ry x-axis-rotation large-arc-flag sweep-flag x y
	//   rx, ry          = radius of clock
	//   x-axis-rotation = 0
	//   large-arc-flag  = calculated
	//   sweep-flag      = fix
	//   x, y            = @ end
	const str = `M ${start.x} ${start.y} A ${radius} ${radius} 0 ${largeArc} 0 ${end.x} ${end.y} L 0 0 Z`;
	return str;
}

export class KioskClock extends ClientAppElement {
	/** @type {TimeInterval} */
	timer;

	constructor() {
		super(app);
		this.attachShadow({ mode: 'open' });

		this.shadowRoot.innerHTML = `
			<style>
				svg {
					height: 100%;
					width: 100%;
					
					background-color: black;
				}
			</style>
			<svg viewbox="-100 -100 200 210" preserveAspectRatio="xMidYMid meet">
				<path id="arcTotal"  fill="#500000" />
				<path id="arcRemain" fill="#003000" />
				<circle cx="0" cy="0" r="${circleRadius}" fill="none" stroke="gray" stroke-width="1"></circle>
				<circle cx="0" cy="0" r="5" fill="gray"></circle>
				<g id="numbers" />
				<line id="handH" x1=0 y1=0 x2=0  y2=-${handLengths.h} stroke-linecap="round" stroke-width=4 stroke="orange" />
				<line id="handM" x1=0 y1=0 x2=${handLengths.m} y2=0   stroke-linecap="round" stroke-width=4 stroke="red"     />
				<line id="handS" x1=0 y1=0 x2=0  y2=${handLengths.s}  stroke-linecap="round" stroke-width=1 stroke="gray"    />
				<text id="date"  x=0 y=50 text-anchor="middle" alignment-baseline="central" fill="green" font-size="16" stroke="black" stroke-width="0.3" >date</text>
				<text id="dow"   x=0 y=105 text-anchor="middle" alignment-baseline="central" fill="white" font-size="10" >dow</text>
			</svg>
		`;

		const numbersEl = this.shadowRoot.querySelector('#numbers');
		for (let i = 1; i <= 12; i++) {
			numbersEl.insertAdjacentHTML('beforeend', `<text text-anchor="middle" alignment-baseline="central" fill="orange" font-size="10"
				x="${polar2cartesianX(87, angleFromHours(i))}"
				y="${polar2cartesianY(87, angleFromHours(i))}"
				>${i}</text>`);

			if (!this.hasAttribute('no-date')) {
				numbersEl.insertAdjacentHTML('beforeend', `<text text-anchor="middle" alignment-baseline="central" fill="orange" font-size="5"
					x="${polar2cartesianX(78, angleFromHours(i))}"
					y="${polar2cartesianY(78, angleFromHours(i))}"
					>${i + 12}</text>`);
			}
		}

		if (!this.hasAttribute('no-date')) {
			for (let i = 0; i < 60; i++) {
				numbersEl.insertAdjacentHTML('beforeend', `<text text-anchor="middle" alignment-baseline="central" fill="red" font-size="3"
				x="${polar2cartesianX(92, angleFromMinutes(i))}"
				y="${polar2cartesianY(92, angleFromMinutes(i))}"
				>${i}</text>`);
			}
		}

		this.hands = {
			h: this.shadowRoot.querySelector('#handH'),
			m: this.shadowRoot.querySelector('#handM'),
			s: this.shadowRoot.querySelector('#handS'),
		};
		this.arcEl = {
			total: /** @type {HTMLElement} */ (this.shadowRoot.querySelector('#arcTotal')),
			remain: /** @type {HTMLElement} */ (this.shadowRoot.querySelector('#arcRemain')),
		};
		this.dateEl = /** @type {HTMLElement} */ (this.shadowRoot.querySelector('#date'));
		this.dowEl = /** @type {HTMLElement} */ (this.shadowRoot.querySelector('#dow'));

		this.timer = this.addTimeInterval(() => this.adapt(), 1);
		this.adapt();
	}

	setServerState(status) {
		super.setServerState(status);
		this.adapt();
	}

	adapt() {
		// https://www.w3schools.com/graphics/tryit.asp?filename=trycanvas_clock_start

		let now = new Date();
		let hour = now.getHours();
		let minute = now.getMinutes();
		let second = now.getSeconds();

		// hand: hour
		let hourAngle = (hour % 12 * Math.PI / 6) +
			(minute * Math.PI / (6 * 60)) +
			(second * Math.PI / (360 * 60));
		this.hands.h.setAttribute('x2', '' + polar2cartesianX(handLengths.h, hourAngle - Math.PI / 2));
		this.hands.h.setAttribute('y2', '' + polar2cartesianY(handLengths.h, hourAngle - Math.PI / 2));

		// hand: minute
		let minuteAngle = (minute * Math.PI / 30) +
			(second * Math.PI / (30 * 60));
		this.hands.m.setAttribute('x2', '' + polar2cartesianX(handLengths.m, minuteAngle - Math.PI / 2));
		this.hands.m.setAttribute('y2', '' + polar2cartesianY(handLengths.m, minuteAngle - Math.PI / 2));

		// hand: second
		let secondAngle = (second * Math.PI / 30);
		this.hands.s.setAttribute('x2', '' + polar2cartesianX(handLengths.s, secondAngle - Math.PI / 2));
		this.hands.s.setAttribute('y2', '' + polar2cartesianY(handLengths.s, secondAngle - Math.PI / 2));

		if (this.hasAttribute('no-date')) {
			this.dateEl.style.display = 'none';
			this.dowEl.style.display = 'none';
		} else {
			// text: date
			this.dateEl.style.display = 'initial';
			this.dateEl.innerHTML = `${now.getDate()}-${(now.getMonth() + 1)}-${now.getFullYear()}`;

			// text: day of the week
			this.dowEl.style.display = 'initial';
			let dow = (now.getDay() - 1 + 7) % 7; // Handle negative numbers
			// dow = Math.floor(second % 7); // Debug
			const dows = ['Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi', 'Dimanche'];
			this.dowEl.innerHTML = dows[dow];
			this.dowEl.setAttribute('x', '' + ((dow * 200 / 7) - 100));
		}

		if (this.status && this.status.currentTicker && this.status.currentTicker.stat.end > new Date()) {
			const start = this.status.currentTicker.stat.start;
			const end = this.status.currentTicker.stat.end;
			this.arcEl.total.style.display = 'initial';
			this.arcEl.remain.style.display = 'initial';
			this.arcEl.total.setAttribute('d', describeArc(circleRadius, angleFromMinutes(start.getMinutes()), angleFromMinutes(end.getMinutes())));
			this.arcEl.remain.setAttribute('d', describeArc(circleRadius, angleFromMinutesSeconds(minute, second), angleFromMinutes(end.getMinutes())));
		} else {
			this.arcEl.total.style.display = 'none';
			this.arcEl.remain.style.display = 'none';
		}
	}
}

customElements.define('kiosk-clock', KioskClock);

app
	.setMainElementBuilder(() => new KioskClock())
	.menuBasedOnIcon('../packages/clock/clock.png');

app
	.onServerStateChanged((status, app) => {
		if (status?.currentTicker) {
			app.setPriority(priorities.clock.elevated);
		} else {
			app.setPriority(priorities.clock.normal);
		}
	});

export default app;
