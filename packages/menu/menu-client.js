
import selectApplication from '../../client/client-app-chooser.js';
import AppFactory from '../../client/client-app.js';
const app = AppFactory('menu');

// Loading all apps (sent by the server)
app.subscribe('.apps', () => updateApps());
/**
 *
 */
function updateApps() {
	const apps = require('electron').remote.require('./packages/menu/menu-server.js').getAppConfigs();
	for (const appName of Object.keys(apps)) {
		app.debug(`Registering app by menu: ${appName}`, apps[appName]);
		AppFactory(appName)
			.withPriority(apps[appName].priority)
			.mainBasedOnIFrame(apps[appName].url)
			.menuBasedOnIcon(apps[appName].icon, apps[appName].label)
			;
	}
}

class KioskMenu extends app.getKioskEventListenerMixin()(HTMLElement) {
	get kioskEventListeners() {
		return {
			'apps.list': (list) => this.adaptToList(list)
		};
	}

	adaptToList(list) {
		// TODO: optimization -> make the diff ?
		this.innerHTML = '';
		this.classList.add('grid');
		this.classList.add('fit');

		for (const app of list.filter(a => a.menuElement && a.mainElement)) {
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

// Insert the icon on top of the body

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
	app.debug('Going to the menu pane');
	selectApplication(app);
});

updateApps();
