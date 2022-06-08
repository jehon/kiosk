
import ClientElement from '../client/client-element.js';
import { sendToServer } from '../client/client-server.js';

export default class KioskWebviewElement extends ClientElement {
    #activePriority = 0;
    #inactivePriority = 0;

    connectedCallback() {
        super.connectedCallback();
        sendToServer(this.app.getChannel(), { active: true });
        this.app.setPriority(this.#activePriority);
    }

    disconnectedCallback() {
        super.disconnectedCallback();
        sendToServer(this.app.getChannel(), { active: false });
        this.app.setPriority(this.#inactivePriority);
    }

    withActivePriority(ep) {
        this.#activePriority = ep;
        return this;
    }

    ready() {
        this.shadowRoot.innerHTML = '';
    }
}

customElements.define('kiosk-webview-element', KioskWebviewElement);
