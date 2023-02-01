
import ClientElement from '../../client/client-element.js';
import { ClientApp } from '../../client/client-app.js';
import { priorities } from '../../client/config.js';
import { humanActiveStatus } from '../human/human-client.js';

const app = new ClientApp('fire');

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
    this.#video = this.shadowRoot.querySelector('video');
    this.#videoSource = this.shadowRoot.querySelector('#source');

    // TODO: To detect errors, we should check for error
    // on the last "source" tag:
    // https://stackoverflow.com/questions/5573461/html5-video-error-handling/33471125#33471125

  }

  stateChanged(status) {
    if (!status || !status.server || !status.server.config) {
      return;
    }
    let url = status.server.config.url;
    if (!url) {
      return;
    }
    if ((url[0] != '/') && (url.substr(0, 4) != 'http')) {
      url = '../' + url;
    }
    if (this.#videoSource.getAttribute('src') != url) {
      this.#videoSource.setAttribute('src', url);
      this.#videoSource.setAttribute('type', status.server.config.type);
      this.#video.oncanplay = () => this.#video.play();
    }

    if (status.active) {
      this.#video.setAttribute('controls', 'controls');
    } else {
      this.#video.removeAttribute('controls');
    }
  }
}

customElements.define('kiosk-fire-main-element', KioskFireMainElement);

app
  .setMainElementBuilder(() => new KioskFireMainElement())
  .menuBasedOnIcon('../packages/fire/fire.jpg');

app
  .onStateChange((status, app) => {
    if (!status || !status.server) {
      return;
    }
    if (status.server.currentTicker) {
      app.setPriority(priorities.fire.elevated);
    } else {
      app.setPriority(priorities.fire.normal);
    }
  });

humanActiveStatus.onChange((active) => {
  const status = app.getState();
  status.active = active;
  app.setState(status);
});

export default app;
