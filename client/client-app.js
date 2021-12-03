
// Common elements
import '../node_modules/@jehon/css-inherit/jehon-css-inherit.js';

import { registerApp, autoSelectApplication, selectApplication } from './client-lib-chooser.js';
import ClientElement from './client-element.js';
import App from '../common/app.js';
import { clientLoggerFactory } from './client-customs.js';
import { sendToServer } from './client-server.js';
import KioskTimedDiv from './elements/timed-div.js';

const debugEl = document.querySelector('#debug');

export class ClientApp extends App {
	priority = 0;

	constructor(name, initialState = {}) {
		super(name,
			(namespace) => clientLoggerFactory(namespace + ':client'),
			initialState
		);

		this.info('Registering app', this.name, this);

		require('electron').ipcRenderer.on(this.ctxize('.status'), (_event, serverStatus) => {
			this.debug('Server status updated to ', serverStatus);
			const status = this.getState();
			status.server = serverStatus;
			this.setState(status);
		});

		sendToServer('history', this.ctxize('.status'));
		registerApp(this);
	}

	/**
	 * @override
	 */
	error(...args) {
		super.error(...args);
		if (debugEl) {
			new KioskTimedDiv()
				.withLevel('error')
				.withJSON(args)
				.in(debugEl);
		}
	}

	/**
	 * @override
	 */
	info(...args) {
		super.info(...args);
		if (debugEl) {
			new KioskTimedDiv()
				.withLevel('info')
				.withJSON(args)
				.in(debugEl);
		}
	}

	/**
	 * @override
	 */
	debug(...args) {
		super.debug(...args);
		if (debugEl) {
			new KioskTimedDiv()
				.withLevel('debug')
				.withJSON(args)
				.in(debugEl);
		}
	}

	//
	//
	// Configuration
	//
	//

	dispatchAppChanged() {
		autoSelectApplication();
		return this;
	}

	/**
	 *  101..1000: application need special attention
	 *  100: Background application (default)
	 *  0: nothing
	 * -1: disabled
	 *
	 * @param {number} newPriority to be set (will be compared for change)
	 * @returns {ClientApp} this
	 */
	setPriority(newPriority = 0) {
		if (this.priority != newPriority) {
			this.priority = newPriority;
			this.dispatchAppChanged();
		}
		return this;
	}

	//
	//
	// Elements
	//
	//

	/**
	 * To link elements to this application
	 *
	 * @param {HTMLElement} el to be linked
	 * @returns {HTMLElement} for linking
	 */
	_linkElement(el) {
		if (el instanceof ClientElement) {
			el.init(this);
		}
		return el;
	}

	/**
	 *
	 * @param {function(): HTMLElement} mEBuilder to build the main element
	 * @returns {ClientApp} for chaining
	 */
	setMainElementBuilder(mEBuilder) {
		this.mainElementBuilder = mEBuilder;
		this.dispatchAppChanged();
		return this;
	}

	/**
	 * Build a main element
	 *
	 * @returns {HTMLElement} built
	 */
	buildMainElement() {
		return this._linkElement(this.mainElementBuilder());
	}

	/**
	 * @param {HTMLElement} element the menu element
	 * @returns {ClientApp} this
	 */
	setMenuElement(element) {
		this.menuElement = this._linkElement(element);
		this.dispatchAppChanged();
		return this;
	}

	/**
	 * @returns {HTMLElement} the menu element
	 */
	getMenuElement() {
		return this.menuElement;
	}

	menuBasedOnIcon(url, text = '') {
		if (!text) {
			text = this.name;
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

	setStatusElement(el) {
		document.querySelector('#status-bar')?.append(this._linkElement(el));
		return this;
	}
}

/**
 * @param {string} url of the iFrame
 * @returns {HTMLElement} of the iFrame
 */
export function iFrameBuilder(url) {
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

	return iframe;
}
