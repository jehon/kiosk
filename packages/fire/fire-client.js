
import ClientAppElement from '../../client/client-app-element.js';
import { ClientApp } from '../../client/client-app.js';
import { priorities } from '../../client/config.js';

// import { humanActiveStatus } from '../human/human-client.js';

const app = new ClientApp('fire');

// status: {
//     currentTicker: null,
//     config: {
//       cron: '0 0 18 * 1-2,11-12 *',
//       duration: 90,
//       url: '/media/exploits/fire.720.mp4'
//     }
//   }

export class KioskFire extends ClientAppElement {
	/**
	 * @type {HTMLVideoElement}
	 */
	#video;

	/**
	 * @type {HTMLSourceElement}
	 */
	#videoSource;

	/**
	 * @type {function(void):void}
	 */
	#inactiveListener;

	constructor() {
		super(app);
		this.attachShadow({ mode: 'open' });
		this.shadowRoot.innerHTML = `
			<style>
				video {
					width: 95%; 
					height: 95%
				}

				video[x-fullscreen] {
					position: fixed; 
					right: 0; 
					bottom: 0;
					
					min-width: 100%; 
					min-height: 100%;
					
					width: auto; 
					height: auto; 
					z-index: -100;
				}
			</style>
			<video autoplay muted loop controls
					poster='../packages/fire/fire.jpg'
					crossorigin='anonymous'
					x-fullscreen
				>
				<source id='source' src=''></source>
				No source selected
			</video>
		`;
		this.#video = this.shadowRoot.querySelector('video');
		this.#videoSource = this.shadowRoot.querySelector('#source');
		this.adapt();

		// TODO: To detect errors, we should check for error
		// on the last "source" tag:
		// https://stackoverflow.com/questions/5573461/html5-video-error-handling/33471125#33471125

	}

	/**
	 * @override
	 */
	setServerState(status) {
		super.setServerState(status);
		this.adapt();
	}

	adapt() {
		if (!this.status) {
			return;
		}
		let url = this.status?.config?.url;
		if (!url) {
			return;
		}
		if ((url[0] != '/') && (url.substr(0, 4) != 'http')) {
			url = '../' + url;
		}
		if (this.#videoSource.getAttribute('src') != url) {
			this.#videoSource.setAttribute('src', url);
			this.#videoSource.setAttribute('type', this.status.config.type);
			this.#video.oncanplay = () => this.#video.play();
		}
	}

	connectedCallback() {
		super.connectedCallback();

		// TODO: show "controls" when active
		this.#inactiveListener = app.onClientStateChanged('inactive', (inactive) => {
			if (inactive) {
				this.#video.setAttribute('x-fullscreen', 'x-fullscreen');
				this.#video.removeAttribute('controls');
				// https://www.electronjs.org/docs/api/web-contents#contentsexecutejavascriptcode-usergesture
				// https://www.electronjs.org/docs/api/remote
				//   -> remote.getCurrentWebContents()
			} else {
				this.#video.removeAttribute('x-fullscreen');
				this.#video.setAttribute('controls', 'controls');
			}
		});
	}

	disconnectedCallback() {
		super.disconnectedCallback();

		if (this.#inactiveListener) {
			this.#inactiveListener();
		}
		this.#inactiveListener = null;
	}

}

customElements.define('kiosk-fire', KioskFire);

app
	.setMainElementBuilder(() => new KioskFire())
	.menuBasedOnIcon('../packages/fire/fire.jpg');

app
	.onServerStateChanged((status, app) => {
		if (status.currentTicker) {
			app.setPriority(priorities.fire.elevated);
		} else {
			app.setPriority(priorities.fire.normal);
		}
	});

export default app;
