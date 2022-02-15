
import { ClientApp } from './client-app.js';
import { ACTIVITY_SUB_CHANNEL } from '../common/constants.js';
import { sendToServer } from './client-server.js';

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

    get activityChannel() {
        return this.app?.name + ACTIVITY_SUB_CHANNEL;
    }

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
        sendToServer(this.activityChannel, { active: true });

        this.#appStateChangeListenerStopper();
        this.#appStateChangeListenerStopper = this.#app.onStateChange((state) => {
            // We need a state
            if (!state) {
                return;
            }
            this.stateChanged(state);
        });
    }

    disconnectedCallback() {
        this.#appStateChangeListenerStopper();
        this.#appStateChangeListenerStopper = () => { };
    }

    ready() { }
    stateChanged(_status) { }
}
