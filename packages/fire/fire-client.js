import ClientElement from "../../client/client-element.js";
import { ClientApp } from "../../client/client-app.js";
import { priorities } from "../../client/config.js";
import { humanActiveStatus } from "../human/human-client.js";

const app = new ClientApp("fire", {
  active: false,
  currentTicker: null,
  config: {}
});

let schedulerStop = null;

/**
 * Initialize the package
 *
 * @param {object} config to start the stuff
 * @returns {module:client/ClientApp} the app
 */
export function init(config = app.getConfig(".", {})) {
  app.mergeState({
    config
  });

  if (schedulerStop) {
    schedulerStop();
  }

  schedulerStop = app.cron({
    cron: config.cron,
    duration: config.duration ?? 0,
    onCron: (context, stats) => {
      app.mergeState({
        currentTicker: { context, stats }
      });
    },
    onEnd: () => {
      app.mergeState({
        currentTicker: null
      });
    }
  });

  return app;
}

init();

export class KioskFireMainElement extends ClientElement {
  /**
   * @type {HTMLVideoElement}
   */
  #video;

  /**
   * @type {HTMLSourceElement}
   */
  #videoSource;

  ready() {
    this.shadowRoot.innerHTML = `
			<style>
				video {
					width: 100%;
					height: 100%;
					object-fit: contain;
					overflow: hidden;
				}
			</style>
			<video autoplay muted loop controls
					poster='../packages/fire/fire.jpg'
					crossorigin='anonymous'
					x-fullscreen
				>
				<source id='source' src=''></source>
				No source selected
			</video>
		`;
    this.#video = this.shadowRoot.querySelector("video");
    this.#videoSource = this.shadowRoot.querySelector("#source");

    // TODO: To detect errors, we should check for error
    // on the last "source" tag:
    // https://stackoverflow.com/questions/5573461/html5-video-error-handling/33471125#33471125
  }

  stateChanged(status) {
    if (!status?.config) {
      return;
    }
    let url = status.config.url;
    if (!url) {
      return;
    }
    if (url[0] != "/" && url.substr(0, 4) != "http") {
      url = "../" + url;
    }
    if (this.#videoSource.getAttribute("src") != url) {
      this.#videoSource.setAttribute("src", url);
      this.#videoSource.setAttribute("type", status.config.type);
      this.#video.oncanplay = () => this.#video.play();
    }

    if (status.active) {
      this.#video.setAttribute("controls", "controls");
    } else {
      this.#video.removeAttribute("controls");
    }
  }
}

customElements.define("kiosk-fire-main-element", KioskFireMainElement);

app
  .setMainElementBuilder(() => new KioskFireMainElement())
  .menuBasedOnIcon("../packages/fire/fire.jpg");

app.onStateChange((status, app) => {
  if (status.currentTicker) {
    app.setPriority(priorities.fire.elevated);
  } else {
    app.setPriority(priorities.fire.normal);
  }
});

humanActiveStatus.onChange((active) => {
  app.mergeState({
    active: active
  });
});

export default app;
