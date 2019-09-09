
import AppFactory, { renderMixin } from '../../client/client-api.js';
import { getApplicationsList, getApplicationByName } from '../../client/client-api-apps.js';
const app = AppFactory('menu');

// Loading all apps (sent by the server)
app.subscribe('.apps', (apps) => {
	for(const appName of Object.keys(apps)) {
		app.info(`Registering app by menu: ${appName}`, apps[appName]);
		AppFactory(appName)
			.withPriority(apps[appName].priority)
			.mainBasedOnIFrame(apps[appName].url)
			.menuBasedOnIcon(apps[appName].icon, apps[appName].label)
		;
	}
});

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

// Insert the icon on top of the body

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
	app.debug('Going to the menu pane');
	getApplicationByName('menu').goManually();
});

app.subscribe('caffeine.activity', active => {
	app.debug('Activity recieved', active);
	appMenuElement.style.display = (active ? '' : 'none');
});
