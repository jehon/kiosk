
import ClientElement from '../../client/client-element.js';
import { ClientApp } from '../../client/client-app.js';
import { priorities } from '../../client/config.js';
import { angleFromHours, angleFromMinutes, angleMSFromTime, circleRadius, describeArc, handLengths, polar2cartesianX, polar2cartesianY } from './clock-draw.js';

const app = new ClientApp('clock', {
	currentTicker: null,
	now: new Date()
});

const registeredCron = [];

/**
 * Initialize the package
 *
 * @param {object} config to start the stuff
 * @returns {module:client/ClientApp} the app
 */
export function init(config = app.getConfig('.', {})) {
	app.setState({
		currentTicker: null,
		now: new Date()
	});

	while (registeredCron.length > 0) {
		registeredCron.pop()();
	}

	if (config.tickers) {
		for (const l of Object.keys(config.tickers)) {
			const oneTickerConfig = config.tickers[l];
			app.debug('Programming:', l, oneTickerConfig);
			registeredCron.push(app.cron(
				{
					cron: oneTickerConfig.cron,
					duration: oneTickerConfig.duration,
					context: {
						name: l,
						...oneTickerConfig
					},
					onCron: (context, stats) => {
						const status = app.mergeState({
							currentTicker: {
								data: context,
								stats
							}
						});

						app.onDate(stats.end).then(() => {
							// Is the current ticker still active?
							if (status.currentTicker.stats.end <= status.now) {
								app.mergeState({
									currentTicker: null
								});
							}
						});
					}
				}));
		}
	}
	return app;
}

init();

export class KioskClockMainElement extends ClientElement {
	/** @override */
	ready() {
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
	}

	/** @override */
	stateChanged(status) {
		// https://www.w3schools.com/graphics/tryit.asp?filename=trycanvas_clock_start
		let hour = status.now.getHours();
		let minute = status.now.getMinutes();
		let second = status.now.getSeconds();

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
			this.dateEl.innerHTML = `${status.now.getDate()}-${(status.now.getMonth() + 1)}-${status.now.getFullYear()}`;

			// text: day of the week
			this.dowEl.style.display = 'initial';
			let dow = (status.now.getDay() - 1 + 7) % 7; // Handle negative numbers
			// dow = Math.floor(second % 7); // Debug
			const dows = ['Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi', 'Dimanche'];
			this.dowEl.innerHTML = dows[dow];
			this.dowEl.setAttribute('x', '' + ((dow * 200 / 7) - 100));
		}

		if (status.currentTicker?.stats.end > new Date()) {
			const start = status.currentTicker.stats.start;
			const end = status.currentTicker.stats.end;
			this.arcEl.total.style.display = 'initial';
			this.arcEl.remain.style.display = 'initial';
			this.arcEl.total.setAttribute('d', describeArc(circleRadius, angleMSFromTime(start), angleMSFromTime(end)));
			this.arcEl.remain.setAttribute('d', describeArc(circleRadius, angleMSFromTime(status.now), angleMSFromTime(end)));
		} else {
			this.arcEl.total.style.display = 'none';
			this.arcEl.remain.style.display = 'none';
		}
	}
}

customElements.define('kiosk-clock-main-element', KioskClockMainElement);

app
	.setMainElementBuilder(() => new KioskClockMainElement())
	.menuBasedOnIcon('../packages/clock/clock.png');

app
	.onStateChange((status, app) => {
		if (status.currentTicker) {
			app.setPriority(priorities.clock.elevated);
		} else {
			app.setPriority(priorities.clock.normal);
		}
	});

setInterval(() => {
	app.mergeState({
		now: new Date()
	});
}, 1000);

export default app;
