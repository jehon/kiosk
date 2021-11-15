
import { debugActiveStatus } from '../../packages/human/human-client.js';

/**
 * @param m
 */
function ts(m = new Date()) {
    return m.getUTCFullYear() + '-'
        + ('00' + (m.getUTCMonth() + 1)).slice(-2) + '-'
        + ('00' + m.getUTCDate()).slice(-2)
        + ' ' +
        + ('00' + m.getUTCHours()).slice(-2) + ':'
        + ('00' + m.getUTCMinutes()).slice(-2) + ':'
        + ('00' + m.getUTCSeconds()).slice(-2);
}

/**
 * @param msg
 */
function formMsg(msg) {
    if (typeof (msg) == 'object') {
        msg = JSON.stringify(msg, null, 2);
    }
    return '<pre>' + ts + ': ' + msg + '</pre>';
}

class XDebug extends HTMLElement {
    #inactiveListener;

    connectedCallback() {
        this.#inactiveListener = debugActiveStatus.onChangeWeakRef((debugActive) => this.adapt(debugActive));
    }

    disconnectedCallback() {
        if (this.#inactiveListener) {
            this.#inactiveListener();
        }
        this.#inactiveListener = null;
    }

    adapt(debugActive) {
        if (debugActive) {
            this.removeAttribute('hidden');
        } else {
            this.setAttribute('hidden', 'hidden');
        }
    }

    set(msg) {
        this.innerHTML = formMsg(msg);
    }

    add(msg) {
        this.innerHTML += formMsg(msg);
    }
}

customElements.define('x-debug', XDebug);
