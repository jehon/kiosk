
// Common elements
import './elements/img-loading.js';
import './elements/css-inherit.js';

import Callback from '../common/callback.js';
import contextualize from '../common/contextualize.js';
import loggerFactory from './client-lib-logger.js';
import { registerApp, autoSelectApplication, selectApplication } from './client-lib-chooser.js';

const body = document.querySelector('body');

export class ClientAppElement extends HTMLElement {
	setServerState(state) {
		this.status = state;
	}
}

export class ClientApp {
	id = -1;
	name; // private
	c; // contextualizer - private
	logger;
	priority = 0;
	unsubscribeElectronStatus = null;

	constructor(name, initialState = {}) {
		this.serverStateCallback = new Callback(initialState);
		this.name = name;
		this.logger = loggerFactory(this.name);
		this.c = contextualize(this.name);
		this.info('Registering app', this.getName(), this);

		this.unsubscribeElectronStatus = require('electron').ipcRenderer.on(this.c('.status'), (event, status) => {
			this._setServerState(status);
		});

		require('electron').ipcRenderer.send('history', this.c('.status'));
		registerApp(this);
	}

	toJSON() {
		return this.name + '#' + this.id;
	}

	getName() {
		return this.name;
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
	// Server state
	//
	//

	async _setServerState(status) {
		return this.serverStateCallback.emit(status);
	}

	getServerState() {
		return this.serverStateCallback.getState();
	}

	onServerStateChanged(callback) {
		return this.serverStateCallback.onChange(callback);
	}

	//
	//
	// Client state
	//
	//
	onClientStateChanged(characteristic, callback) {
		const analyser = () => {
			callback(body.hasAttribute(characteristic));
		};

		analyser();

		const observer = new MutationObserver(analyser);

		observer.observe(body, { attributes: true });

		return () => observer.disconnect();
	}

	//
	//
	// Configuration
	//
	//

	dispatchAppChanged() {
		// TODO: use a proxy in menu-client???
		autoSelectApplication();
		return this;
	}

	/**
	 *  101..1000: application need special attention
	 *  100: Background application (default)
	 *  0: nothing
	 *
	 * @param {number} newPriority - 0 by default mean not priority
	 * @returns {ClientApp} this
	 */
	setPriority(newPriority = 0) {
		if (typeof (newPriority) != 'number') {
			newPriority = parseInt(newPriority);
		}
		if (this.priority != newPriority) {
			this.priority = newPriority;
			this.dispatchAppChanged();
		}
		return this;
	}

	/**
	 * @param {HTMLElement} element the main element
	 * @returns {ClientApp} this
	 */
	setMainElement(element) {
		this.mainElement = element;
		this.dispatchAppChanged();
		return this;
	}

	/**
	 * @returns {HTMLElement} the main element
	 */
	getMainElement() {
		return this.mainElement;
	}

	/**
	 * @param {HTMLElement} element the menu element
	 * @returns {ClientApp} this
	 */
	setMenuElement(element) {
		this.menuElement = element;
		this.dispatchAppChanged();
		return this;
	}

	/**
	 * @returns {HTMLElement} the menu element
	 */
	getMenuElement() {
		return this.menuElement;
	}

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
		this.setMainElement(iframe);
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
		this.setMenuElement(element);
		return this;
	}
}
