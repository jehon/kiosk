
import AppFactory, { renderMixin } from '../../client/client-api.js';
import { getApplicationsList, getApplicationByName } from '../../client/client-api-apps.js';
const app = AppFactory('menu');
const logger = app.logger;

class KioskMenu extends app.getKioskEventListenerMixin()(renderMixin(HTMLElement)) {
	get kioskEventListeners() {
		return {
			'app.changed': () => this.adapt()
		};
	}

	adapt() {
		// TODO: optimization -> make the diff ?
		this.innerHTML = '';
		this.classList.add('grid');
		this.classList.add('fit');

		for(const app of getApplicationsList().filter(a => a.menuElement && a.mainElement)) {
			app.menuElement.setAttribute('data-app', app.name);
			this.appendChild(app.menuElement);
		}
	}
}
customElements.define('kiosk-menu', KioskMenu);

app
	.withPriority(1500)
	.withMainElement(new KioskMenu())
;

app.subscribe('.apps', (apps) => {
	for(const appName of Object.keys(apps)) {
		const app = apps[appName];
		logger.info(`Registering app by menu: ${appName}`, app);
		AppFactory(appName)
			.withPriority(app.priority)
			.mainBasedOnIFrame(app.url)
			.menuBasedOnIcon(app.icon, app.label)
		;
	}
});

document.querySelector('body').insertAdjacentHTML('beforeend', `
<style>
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
	getApplicationByName('menu').goManually();
});

getApplicationByName('menu').goManually();
