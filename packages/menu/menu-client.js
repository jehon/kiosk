
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

const KioskMenuStatus = document.createElement('div');
KioskMenuStatus.innerHTML = 'Links';
KioskMenuStatus.classList.add('centered');

app
	.withPriority(1500)
	.withMainElement(new KioskMenu())
	.withStatusElement(KioskMenuStatus)
;

app.subscribe('.apps', (apps) => {
	// TODO: clean up old list
	// getApplicationsList().filter(a => a.byLink).unregister();

	for(const appName of Object.keys(apps)) {
		const app = apps[appName];
		logger.info(`Registering app by menu: ${appName}`, app);
		// const a =
		AppFactory(appName)
			.withPriority(app.priority)
			.mainBasedOnIFrame(app.url)
			.menuBasedOnIcon(app.icon, app.label)
		;
		// a.byMenu = true;
	}
});

// // This is for tests only
// for(let i = 0; i < 20; i++) {
// 	AppFactory('test ' + i)
// 		.withPriority(10000 + i)
// 		.mainBasedOnIFrame('www.google.com')
// 		.menuBasedOnIcon('https://test-ipv6.com/images/hires_ok.png', 'test ' + i);
// }
