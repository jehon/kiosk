
import { ClientApp } from './client-app.js';

export default class ClientElement extends HTMLElement {
    /**
     * To unregister listener (connected/disconnected)
     *
     * @type {function(void):void}
     */
    #appStateChangeListenerStopper = () => { };

    /** @type {ClientApp} */
    #app;
    get app() { return this.#app; }

    constructor() {
        super();
        this.attachShadow({ mode: 'open' });
    }

    init(app) {
        this.#app = app;
        this.ready();
    }

    connectedCallback() {
        if (!this.#app) {
            console.error('Need to call init() first', { app: this.#app, state: this.getState() });
            return;
        }

        this.#appStateChangeListenerStopper();
        this.#appStateChangeListenerStopper = this.#app.onStateChange((state) => this.stateChanged(state));
    }

    disconnectedCallback() {
        this.#appStateChangeListenerStopper();
        this.#appStateChangeListenerStopper = () => { };
    }

    ready() { }
    stateChanged(_status) { }
}
