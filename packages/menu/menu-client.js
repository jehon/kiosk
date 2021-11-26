
import { selectApplication, getApplicationList, autoSelectApplication } from '../../client/client-lib-chooser.js';
import { ClientApp, iFrameBuilder } from '../../client/client-app.js';
import ClientAppElement from '../../client/client-app-element.js';

const app = new ClientApp('menu');

class KioskMenu extends ClientAppElement {
	#top;

	constructor() {
		super();
		this.attachShadow({ mode: 'open' });

		this.shadowRoot.innerHTML = `
			<jehon-css-inherit></jehon-css-inherit>
			<style>
				#top {
					width: 100%;
					height: 100%;
					margin: 0px;
					border: none;
					padding: 20px;

					box-sizing: border-box;

					display: grid;

					align-items: stretch;
					justify-items: stretch;
				
					grid-template-columns: repeat(5, calc(20% - 20px));
					grid-auto-rows: 200px;
				
					grid-gap: 20px;

					background-color: black;
				}
			</style>
			<div id='top'></div>
		`;

		this.#top = this.shadowRoot.querySelector('#top');
	}

	setServerState(status) {
		super.setServerState(status);
		this.adaptToList();
	}

	connectedCallback() {
		this.adaptToList();
	}

	adaptToList() {
		/** @type {Array<ClientApp>} */
		const list = getApplicationList();

		this.#top.innerHTML = '';

		for (const a of list.filter((/** @type {ClientApp} */ a) => a.menuElement && a.mainElementBuilder)) {
			a.menuElement.setAttribute('data-app', a.name);
			this.#top.appendChild(a.menuElement);
		}
	}
}
customElements.define('kiosk-menu', KioskMenu);

app
	.setMainElementBuilder(() => new KioskMenu());

app
	.onServerStateChanged((status, app) => {
		for (const i in status) {
			const a = status[i];
			a.name = i;
			app.debug(`Registering app by menu: ${a.name}`, a);
			const ap = new ClientApp(a.name)
				.setMainElementBuilder(() => iFrameBuilder(a.url))
				.menuBasedOnIcon(a.icon, a.label);
			if ('priority' in a) {
				ap.setPriority(a.priority);
			}

		}
	});

app
	.onClientStateChanged('inactive', (inactive, app) => {
		if (inactive) {
			// Trigger a new calculation of the top app
			app.debug('Back to auto select application');
			autoSelectApplication();
		}
	});

/**
 * Insert the icon on top of the body
 */
function init() {
	document.querySelector('body').insertAdjacentHTML('beforeend', `
<style>
	body[inactive] > #app-menu {
		display: none;
	}

	body > #app-menu {
			position: absolute;
			top: var(--generic-space);
			left: var(--generic-space);
			z-index: 1000;
		}

		body > #app-menu > img {
			width: 40px;
		}
</style>
<div id="app-menu">
	<img src='static/menu.svg' />
</div>
`);

	const appMenuElement = document.querySelector('body > div#app-menu');
	if (appMenuElement == null) {
		throw 'registerAppMenu: #app-menu is null';
	}

	appMenuElement.addEventListener('click', () => {
		// Go to menu list application
		selectApplication(app);
	});
}

init();
