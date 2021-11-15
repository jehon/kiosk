import TimeInterval from '../common/TimeInterval.js';
import { ClientApp } from './client-app.js';

export default class ClientAppElement extends HTMLElement {
    unregister = [];
    timeIntervals = [];

    /** @type {ClientApp} */
    app;

    /**
     * @param {ClientApp?} app to link to
     */
    constructor(app) {
        super();
        this.setApp(app);
    }

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
        for (const ti of this.timeIntervals) {
            ti.start();
        }
    }

    disconnectedCallback() {
        for (const fn of this.unregister) {
            fn();
        }
        this.unregister.length = 0;

        for (const ti of this.timeIntervals) {
            ti.stop();
        }
    }

    addTimeInterval(cb, iSecs) {
        const ti = new TimeInterval(cb, iSecs, this.app.childLogger('time-interval'));
        this.timeIntervals.push(ti);
        return ti;
    }

    addUnregister(u) {
        this.unregister.push(u);
        return this;
    }

    setServerState(state) {
        this.status = state;
    }
}
