
// Common elements
import './elements/img-loading.js';
import './elements/css-inherit.js';

import loggerFactory from './client-logger.js';
import contextualize from '../common.es6/contextualize.js';
import Bus from '../common.es6/bus.js';

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

export class ClientAPI {
	id = idCounter++;
	name; // private
	c; // contextualizer - private
	logger;
	priority = 1000;

	constructor(name) {
		this.name = name;
		this.logger = loggerFactory(this.name);
		this.c = contextualize(this.name);
		this.debug('Registering app', this.getName(), this);
		apps[this.getName()] = this;
		this.dispatchAppChanged();
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
		// TODO here:

		require('electron').ipcRenderer.on(this.c(name), (event, message) => {
			this.debug('Received: ', event, message);
			cb(message);
		});
		return bus.subscribe(this.c(name), cb);
	}
}

export default (space) => new ClientAPI(space);

/*
 *
 * Register apps and links
 *
 */

/**
 * @param name
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



