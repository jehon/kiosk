
// Common elements
import './elements/img-loading.js';
import './elements/css-inherit.js';

import loggerFactory from './client-lib-logger.js';
import Bus from './client-lib-bus.js';
import contextualize from '../common/contextualize.js';

import { kioskEventListenerMixin } from './client-api-mixins.js';

const bus = new Bus(loggerFactory('client:bus'));
const apps = {};

/**
 * Application priorities
 *
 *    0.. 100: application need special attention
 *  100.. 200: application need temporary attention
 *  200.. 500: ?
 *  500..1000: need focus, but not important
 *
 * 1000..9999: background process
 *    5000.5999: link page applications
 */

let idCounter = 1;

let selectApplication = () => { };
import('./client-app-chooser.js').then(mod => {
	selectApplication = mod.default;
});

export class ClientApp {
	id = idCounter++;
	name; // private
	c; // contextualizer - private
	logger;
	priority = 1000;
	unsubscribeElectronStatus = null;

	constructor(name) {
		this.name = name;
		this.logger = loggerFactory(this.name);
		this.c = contextualize(this.name);
		this.debug('Registering app', this.getName(), this);
		apps[this.getName()] = this;

		this.unsubscribeElectronStatus = require('electron').ipcRenderer.on(this.c('.status'), (event, status) => {
			this.onStatusChanged(status);
		});
		this.dispatchAppChanged();
	}

	toJSON() {
		return this.name + '#' + this.id;
	}

	getState() {
		return this.status;
	}

	onStatusChanged(status) {
		this.status = status;
	}

	error(...data) {
		this.logger.error(...data);
	}

	info(...data) {
		this.logger.info(...data);
	}

	debug(...data) {
		this.logger.debug(...data);
	}

	//
	//
	// Configuration
	//
	//
	mainBasedOnIFrame(url) {
		const iframe = document.createElement('iframe');
		iframe.setAttribute('src', url);

		// https://developer.mozilla.org/en-US/docs/Web/HTTP/Feature_Policy
		// https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/Feature-Policy/microphone
		// iframe.setAttribute('allow', 'microphone; camera');
		// iframe.setAttribute('allow', 'microphone *');
		iframe.setAttribute('allow', 'microphone *; camera *');

		// https://developer.mozilla.org/en-US/docs/Web/HTML/Element/iframe
		// sandbox restrict to nothing, but extra attributes re-allow stuff
		iframe.setAttribute('sandbox', 'allow-forms allow-scripts allow-same-origin allow-modals');
		this.withMainElement(iframe);
		return this;
	}

	menuBasedOnIcon(url, text = '') {
		if (!text) {
			text = this.getName();
		}
		let element = document.createElement('div');
		element.classList.add('button');
		element.classList.add('full-background-image');
		element.style.backgroundImage = `url('${url}')`;
		element.innerHTML = `<span>${text}</span>`;
		element.addEventListener('click', () => selectApplication(this));
		this.withMenuElement(element);
		return this;
	}

	dispatchAppChanged() { // TODO: Should be static ?
		// Select the main application
		this.dispatch('apps.list', getApplicationsList());
		return this;
	}

	withPriority(p) {
		if (typeof (p) != 'number') {
			p = parseInt(p);
		}
		this.priority = p;
		this.dispatchAppChanged();
		return this;
	}

	withMainElement(element) {
		this.mainElement = element;
		this.dispatchAppChanged();
		return this;
	}

	withMenuElement(element) {
		this.menuElement = element;
		this.dispatchAppChanged();
		return this;
	}

	changePriority(newPriority) {
		if (this.priority != newPriority) {
			this.priority = newPriority;
			this.dispatchAppChanged();
		}
		return this;
	}

	getName() {
		return this.name;
	}

	//
	//
	// Gui
	//
	//
	/**
	 * @returns {function(HTMLElement): HTMLElement}
	 */
	getKioskEventListenerMixin() {
		return (element) => kioskEventListenerMixin(this, element);
	}

	//
	//
	// Functionnal
	//
	//

	async dispatch(name, data) {
		await bus.dispatch(this.c(name), data);
		return this;
	}

	subscribe(name, cb) {
		return bus.subscribe(this.c(name), cb);
	}

	// async invokeServer(name, params) {
	// 	return require('electron').ipcRenderer.invoke(name, ...params);
	// }
}

export default (space) => new ClientApp(space);

/*
 *
 * Register apps and links
 *
 */

/**
 * @param {string} name of the application
 */
export function getApplicationByName(name) {
	if (!(name in apps)) {
		throw `Unknown app: ${name}. Available: ${Object.keys(apps).join(' ')}`;
	}
	return apps[name];
}

/**
 *
 */
export function getApplicationsList() {
	const papps = Object.keys(apps)
		.map(k => apps[k]);
	// TODO: should be done when refreshing the list
	// TODO: second criteria should be the name
	// !! split event apps.one.changed (one) into apps.list.updated
	papps.sort((a, b) => (a.priority - b.priority));
	return papps;
}

/**
 *
 */
export function _testEmptyApplicationList() {
	for (const k of Object.keys(apps)) {
		delete (apps[k]);
	}
}



