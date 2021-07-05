import { ClientApp } from './client-app.js';

export default class ClientAppElement extends HTMLElement {
    unregister = [];

    /** @type {ClientApp} */
    app

    setApp(app) {
        this.app = app;
        return this;
    }

    connectedCallback() {
        // Unregister potentially connected stuff...
        this.disconnectedCallback();

        this.addUnregister(
            this.app.onServerStateChanged(
                (status) => this.setServerState(status)
            )
        );
    }

    disconnectedCallback() {
        for (const fn of this.unregister) {
            fn();
        }
        this.unregister.length = 0;
    }

    addUnregister(u) {
        this.unregister.push(u);
        return this;
    }

    setServerState(state) {
        this.status = state;
    }
}
