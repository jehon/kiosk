
import loggerFactory from '../common/logger.js';
import contextualize from '../common/contextualize.js';

import { subscribe, dispatch } from './client-api-events.js';
import { kioskEventListenerMixin } from './client-api-mixins.js';

const apps = {};
const logger = loggerFactory('client-api-apps');

export let currentMainApplication = null;
let manualSelectionOfMainApplicationTimer = false;

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

export default class ClientAPI {
	id = idCounter++;
	name; // private
	c; // contextualizer - private
	logger = loggerFactory('unspecified');
	enabled = true;
	priority = 1000;

	constructor(name) {
		this.name = name;
		this.logger = loggerFactory(this.name);
		this.c = contextualize(this.name);
		logger.info('Registering app', this.getName(), this);
		apps[this.getName()] = this;
		this.dispatchAppChanged();
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

	menuBasedOnIcon(url, text) {
		if (!text) {
			text = this.getName();
		}
		let element = document.createElement('div');
		element.classList.add('button');
		element.classList.add('full-background-image');
		element.style.backgroundImage = `url('${url}')`;
		element.innerHTML = `<span>${text}</span>`;
		element.addEventListener('click', () => this.goManually());
		this.withMenuElement(element);
		return this;
	}

	dispatchAppChanged() { // TODO: Should be static ?
		// Select the main application
		if (!manualSelectionOfMainApplicationTimer) {
			currentMainApplication = getApplicationsList().filter(a => a.mainElement)[0];
		}
		dispatch('app.changed');
		return this;
	}

	withPriority(p) {
		if (typeof(p) != 'number') {
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

	withStatusElement(element) {
		this.statusElement = element;
		this.dispatchAppChanged();
		return this;
	}

	withMenuElement(element) {
		this.menuElement = element;
		return this;
	}

	disable() {
		this.enabled = false;
		this.dispatchAppChanged();
		return this;
	}

	enable() {
		this.enabled = true;
		this.dispatchAppChanged();
		return this;
	}

	changePriority(newPriority) {
		this.priority = newPriority;
		this.dispatchAppChanged();
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
	getKioskEventListenerMixin() {
		return (element) => kioskEventListenerMixin(this.name, element);
	}

	//
	//
	// Functionnal
	//
	//

	async dispatch(name, data = null) {
		await dispatch(this.c(name), data);
		return this;
	}

	subscribe(name, cb) {
		subscribe(this.c(name), cb);
		return this;
	}

	goManually() { // TODO: affine "manual" mode
		// Forget previous timer
		if (manualSelectionOfMainApplicationTimer) {
			clearTimeout(manualSelectionOfMainApplicationTimer);
		}

		// Program new timer
		manualSelectionOfMainApplicationTimer = setTimeout(() => {
			manualSelectionOfMainApplicationTimer = false;
			// Trigger a new calculation of the top app
			this.dispatchAppChanged();
		}, 2 * 60 * 1000);

		currentMainApplication = this;
		this.dispatchAppChanged();
	}
}

/*
 *
 * Register apps and links
 *
 */

export function getApplicationByName(name) {
	if (!(name in apps)) {
		throw `Unknown app: ${name}. Available: ${Object.keys(apps).join(' ')}`;
	}
	return apps[name];
}

export function getApplicationsList() {
	const papps = Object.keys(apps)
		.map(k => apps[k])
		.filter(app => app.enabled);
	// TODO: should be done when refreshing the list
	// TODO: second criteria should be the name
	// !! split event apps.one.changed (one) into apps.list.updated
	papps.sort((a, b) => (a.priority - b.priority));
	return papps;
}

export function _testEmptyApplicationList() {
	for(let k of Object.keys(apps)) {
		delete(apps[k]);
	}
}
