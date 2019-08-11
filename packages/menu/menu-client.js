
import AppFactory from '../../client/client-api.js';
import { getApplicationsList } from '../../client/client-api-apps.js';
const app = AppFactory('menu');
const logger = app.logger;

class KioskMenu extends HTMLElement {
	connectedCallback() {
		this.innerHTML = '';
		this.classList.add('grid');
		this.classList.add('fit');

		for(const app of getApplicationsList().filter(a => a.menuElement && a.mainElement)) {
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
