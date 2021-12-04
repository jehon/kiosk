
import { WEBVIEW_SUB_CHANNEL } from '../common/config.js';
import ClientElement from './client-element.js';
import { sendToServer } from './client-server.js';

export default class KioskWebviewElement extends ClientElement {
    #activePriority = 0;
    #inactivePriority = 0;

    get webViewChannel() {
        return this.app?.name + WEBVIEW_SUB_CHANNEL;
    }

    connectedCallback() {
        super.connectedCallback();
        sendToServer(this.webViewChannel, { active: true });
        this.app.setPriority(this.#activePriority);
    }

    disconnectedCallback() {
        super.disconnectedCallback();
        sendToServer(this.webViewChannel, { active: false });
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
