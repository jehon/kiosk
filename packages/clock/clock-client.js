/* global moment */

import { ClientApp, ClientAppElement } from '../../client/client-app.js';

const app = new ClientApp('clock');
export default app;

const defaultPriority = 1250;
const elevatedPriority = 150;

const circleRadius = 97;
const handLengths = {
	h: 55,
	m: 80,
	s: 89
};
/**
 * @param {number} hours 0..12
 * @returns {number} the angle (radian) correspondign to the hours
 */
const angleFromHours = hours => hours * Math.PI * 2 / 12 - Math.PI / 2;
/**
 * @param {number} minutes 0..59
 * @returns {number} the angle (radian) correspondign to the minutes
 */
const angleFromMinutes = minutes => minutes * Math.PI * 2 / 60 - Math.PI / 2;

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

// Thanks to https://jsfiddle.net/upsidown/e6dx9oza/
/**
 * @param {number} radius polar radius
 * @param {number} startAngle (radius)
 * @param {number} endAngle (radius)
 * @returns {string} the SVG description of the arc
 */
function describeArc(radius, startAngle, endAngle) {
	const start = { x: polar2cartesianX(radius, endAngle), y: polar2cartesianY(radius, endAngle) };
	const end = { x: polar2cartesianX(radius, startAngle), y: polar2cartesianY(radius, startAngle) };

	var arcSweep = endAngle - startAngle <= 180 ? '0' : '1';

	return `M ${start.x} ${start.y} A ${radius} ${radius} 0 ${arcSweep} 0 ${end.x} ${end.y} L 0 0 Z`;
}

export class KioskClock extends ClientAppElement {
	/**
	 * @type {number}
	 */
	cron = 0
	constructor() {
		super();
		this.innerHTML = `
			<svg viewbox="-100 -100 200 210" class="full" preserveAspectRatio="xMidYMid meet" style='height: 95%'>
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

		const numbersEl = this.querySelector('#numbers');
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
			h: this.querySelector('#handH'),
			m: this.querySelector('#handM'),
			s: this.querySelector('#handS'),
		};
		this.arcEl = {
			total: /** @type {HTMLElement} */ (this.querySelector('#arcTotal')),
			remain: /** @type {HTMLElement} */ (this.querySelector('#arcRemain')),
		};
		this.dateEl = /** @type {HTMLElement} */ (this.querySelector('#date'));
		this.dowEl = /** @type {HTMLElement} */ (this.querySelector('#dow'));
	}

	connectedCallback() {
		if (!this.cron) {
			this.cron = window.setInterval(() => this.adapt(), 1000);
		}
	}

	disconnectedCallback() {
		if (this.cron) {
			window.clearInterval(this.cron);
			this.cron = 0;
		}
	}

	setServerState(status) {
		super.setServerState(status);
		this.adapt();
	}

	adapt() {
		// https://www.w3schools.com/graphics/tryit.asp?filename=trycanvas_clock_start

		let now = moment().tz('Europe/Brussels');
		let hour = now.hour();
		let minute = now.minute();
		let second = now.second();

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
			this.dateEl.innerHTML = `${now.date()}-${(now.month() + 1)}-${now.year()}`;

			// text: day of the week
			this.dowEl.style.display = 'initial';
			let dow = (now.day() - 1 + 7) % 7; // Handle negative numbers
			// dow = Math.floor(second % 7); // Debug
			const dows = ['Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi', 'Dimanche'];
			this.dowEl.innerHTML = dows[dow];
			this.dowEl.setAttribute('x', '' + ((dow * 200 / 7) - 100));
		}

		if (this.status.currentTicker && this.status.currentTicker.stat.end > new Date()) {
			this.arcEl.total.style.display = 'initial';
			this.arcEl.remain.style.display = 'initial';
			this.arcEl.total.setAttribute('d', describeArc(circleRadius, angleFromMinutes(this.status.currentTicker.stat.start.getMinutes()), angleFromMinutes(this.status.currentTicker.stat.end.getMinutes())));
			this.arcEl.remain.setAttribute('d', describeArc(circleRadius, angleFromMinutesSeconds(minute, second), angleFromMinutes(this.status.currentTicker.stat.end.getMinutes())));
		} else {
			this.arcEl.total.style.display = 'none';
			this.arcEl.remain.style.display = 'none';
		}
	}
}

customElements.define('kiosk-clock', KioskClock);

app
	.setPriority(defaultPriority)
	.setMainElement(new KioskClock())
	.menuBasedOnIcon('../packages/clock/clock.png')
	.onServerStateChanged(status => {
		if (status.currentTicker) {
			app.setPriority(elevatedPriority);
		} else {
			app.setPriority(defaultPriority);
		}
		(/** @type {ClientAppElement} */ (app.getMainElement())).setServerState(status);
	});
