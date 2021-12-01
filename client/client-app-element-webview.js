
import { WEBVIEW_SUB_CHANNEL } from '../common/config.js';
import ClientAppElement from './client-app-element.js';
import { sendToServer } from './client-server.js';

export class KioskClientElementWebView extends ClientAppElement {
    #channel;
    #activePriority = 0;
    #inactivePriority = 0;

    constructor(app) {
        super(app);
        this.#channel = app.name + WEBVIEW_SUB_CHANNEL;
    }

    connectedCallback() {
        super.connectedCallback();
        sendToServer(this.#channel, { active: true });

        this.app.setPriority(this.#activePriority);
    }

    disconnectedCallback() {
        super.disconnectedCallback();
        sendToServer(this.#channel, { active: false });
        this.app.setPriority(this.#inactivePriority);
    }

    withElevatedPriority(ep) {
        this.#activePriority = ep;
        return this;
    }
}

customElements.define('kiosk-client-element-webview', KioskClientElementWebView);

export default KioskClientElementWebView;
