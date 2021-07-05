
import ClientAppElement from '../../client/client-app-element.js';
import { ClientApp } from '../../client/client-app.js';
import { priorities } from '../../client/config.js';

export class KioskFire extends ClientAppElement {
	/**
	 * @type {number}
	 */
	#cron = 0

	/**
	 * @type {HTMLVideoElement}
	 */
	#video

	/**
	 * @type {HTMLSourceElement}
	 */
	#videoSource

	/**
	 * @type {function(void):void}
	 */
	#inactiveListener

	constructor() {
		super();
		this.innerHTML = `
			<video autoplay muted loop controls
					poster='../packages/fire/fire.jpg'
					crossorigin='anonymous'
					style='width: 95%; height: 95%'
				>
				<source id='source' src=''></source>
				No source selected
			</video>
		`;
		this.#video = this.querySelector('video');
		this.#videoSource = this.querySelector('#source');
		this.adapt();

		// this.#video.addEventListener('click', () => {
		// 	// https://developer.mozilla.org/en-US/docs/Web/API/Fullscreen_API/Guide
		// 	// https://developer.mozilla.org/en-US/docs/Web/API/Element/requestFullscreen
		// 	console.log('Full screen ?');

		// 	if (!document.fullscreenElement) {
		// 		console.log('Full screen go');
		// 		this.#video.requestFullscreen();
		// 	} else {
		// 		console.log('Full screen leaving');
		// 		document.exitFullscreen();
		// 	}
		// });
	}

	setServerState(status) {
		super.setServerState(status);
		this.adapt();
	}

	adapt() {
		let url = this.status?.config?.url;
		if (!url) {
			return;
		}
		if ((url[0] != '/') && (url.substr(0, 4) != 'http')) {
			url = '../' + url;
		}
		if (this.#videoSource.getAttribute('src') != url) {
			this.#videoSource.setAttribute('src', url);
			this.#video.oncanplay = () => this.#video.play();
		}
	}

	connectedCallback() {
		// TODO: show "controls" when active
		this.#inactiveListener = app.onClientStateChanged('inactive', (inactive) => {
			if (inactive) {
				this.#video.removeAttribute('controls');
				// https://www.electronjs.org/docs/api/web-contents#contentsexecutejavascriptcode-usergesture
				// https://www.electronjs.org/docs/api/remote
				//   -> remote.getCurrentWebContents()
			} else {
				this.#video.setAttribute('controls', 'controls');
			}
		});
	}

	disconnectedCallback() {
		if (this.#inactiveListener) {
			this.#inactiveListener();
		}
		this.#inactiveListener = null;
	}

}

customElements.define('kiosk-fire', KioskFire);

const app = new ClientApp('fire')
	.setMainElementBuilder(() => new KioskFire())
	.menuBasedOnIcon('../packages/fire/fire.jpg');

app.onServerStateChanged((status, app) => {
	if (status.currentTicker) {
		app.setPriority(priorities.fire.elevated);
	} else {
		app.setPriority(priorities.fire.normal);
	}
});

export default app;
