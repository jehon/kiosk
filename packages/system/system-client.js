
import ClientElement from '../../client/client-element.js';
import { ClientApp } from '../../client/client-app.js';
import { priorities } from '../../client/config.js';

const app = new ClientApp('system');

export class KioskSystemMainElement extends ClientElement {
    /** @type {HTMLElement} */
    #pre;

    connectedCallback() {
        super.connectedCallback();
        this.app.setPriority(priorities.manuallySelected.elevated);
    }

    disconnectedCallback() {
        super.disconnectedCallback();
        this.app.setPriority(priorities.manuallySelected.normal);
    }

    /** @override */
    ready() {
        this.shadowRoot.innerHTML = `
            <style>
                pre {
                    background-color: black;
                    height: 100%;
                    margin-left: 50px;
                }
            </style>
            <pre></pre>
        `;
        this.#pre = this.shadowRoot.querySelector('pre');
    }

    /** @override */
    stateChanged(status) {
        this.#pre.innerHTML = JSON.stringify(status.server, null, 2);
    }
}

customElements.define('kiosk-system-main-element', KioskSystemMainElement);

app
    .setMainElementBuilder(() => new KioskSystemMainElement())
    .menuBasedOnIcon('../packages/system/system.svg');

export default app;
