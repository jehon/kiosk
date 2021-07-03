
import { selectApplication, getApplicationList, autoSelectApplication } from '../../client/client-lib-chooser.js';
import { ClientApp, ClientAppElement } from '../../client/client-app.js';

const app = new ClientApp('menu');

class KioskMenu extends ClientAppElement {
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

		// TODO: optimization -> make the diff ?
		this.innerHTML = '';
		this.classList.add('grid');
		this.classList.add('fit');

		for (const a of list.filter((/** @type {ClientApp} */ a) => a.menuElement && a.mainElement)) {
			a.menuElement.setAttribute('data-app', a.name);
			this.appendChild(a.menuElement);
		}
	}
}
customElements.define('kiosk-menu', KioskMenu);

app.onClientStateChanged('inactive', (inactive) => {
	if (inactive) {
		// Trigger a new calculation of the top app
		app.debug('Back to auto select application');
		autoSelectApplication();
	}
});

app
	.setMainElement(new KioskMenu())
	.onServerStateChanged((status) => {
		for (const i in status) {
			const a = status[i];
			a.name = i;
			app.debug(`Registering app by menu: ${a.name}`, a);
			const ap = new ClientApp(a.name)
				.mainBasedOnIFrame(a.url)
				.menuBasedOnIcon(a.icon, a.label);
			if ('priority' in a) {
				ap.setPriority(a.priority);
			}

		}
	});

// Insert the icon on top of the body

/**
 *
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
