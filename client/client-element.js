import { ClientApp } from "./client-app.js";
import { sendToServer } from "./client-server.js";
import "../node_modules/@jehon/img-loading/jehon-image-loading.js";

export default class ClientElement extends HTMLElement {
  /**
   * To unregister listener (connected/disconnected)
   *
   * @type {function(void):void}
   */
  #appStateChangeListenerStopper = () => {};

  /** @type {ClientApp} */
  #app;
  get app() {
    return this.#app;
  }

  constructor() {
    super();
    this.attachShadow({ mode: "open" });
  }

  init(app) {
    this.#app = app;
    this.ready();
  }

  connectedCallback() {
    if (!this.#app) {
      console.error("Need to call init() first", {
        app: this.#app,
        state: this.getState()
      });
      return;
    }
    sendToServer(this.#app?.getChannel(), { active: true });

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
    this.#appStateChangeListenerStopper = () => {};

    sendToServer(this.#app?.getChannel(), { active: false });
  }

  ready() {}
  stateChanged(_status) {}
}
