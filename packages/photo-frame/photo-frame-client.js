
import ClientElement from '../../client/client-element.js';
import { ClientApp } from '../../client/client-app.js';
import { priorities } from '../../client/config.js';
import { humanActiveStatus } from '../human/human-client.js';
import JehonImageLoading from '../../node_modules/@jehon/img-loading/jehon-image-loading.js';

JehonImageLoading.setWaitingWheelUrl('/node_modules/@jehon/img-loading/waiting.png');
JehonImageLoading.settransitionTimeMs(500);
/*

Status (client)

{
	pictureIndex: int
	active: boolean
}

*/

const app = new ClientApp('photo-frame');

// Select the next picture
/**
 *
 */
function autoMoveToNextImage() {
  const status = app.getState();
  app.debug('autoMoveToNextImage', status.pictureIndex);
  if (!status.server || !status.server.listing || status.server.listing.length == 0) {
    // Wait for a new list
    return;
  } else {
    next();
  }
}

// TODO: parameter + handle human interaction
setInterval(() => autoMoveToNextImage(), 15 * 1000);

/**
 * @returns {number} the next index
 */
function next() {
  const status = app.getState();
  status.pictureIndex++;
  if (status.pictureIndex >= status.server.listing.length) {
    status.pictureIndex = 0;
  }

  app.setState(status);
  return status.pictureIndex;
}

/**
 * @returns {number} the previous index
 */
function prev() {
  const status = app.getState();
  status.pictureIndex--;
  if (status.pictureIndex < 0) {
    status.pictureIndex = status.server.listing.length - 1;
  }

  app.setState(status);
  return status.pictureIndex;
}

class KioskPhotoFrameMainElement extends ClientElement {

  /** @type {JehonImageLoading} */
  #carouselImg;

  /** @type {HTMLElement} */
  #carouselInfos;

  ready() {
    this.shadowRoot.innerHTML = `
		<jehon-css-inherit></jehon-css-inherit>
		<style>
			.hide-on-inactive[inactive] {
				display: none;
			}

			#myCarousel {
				position: relative;
				width: 100%;
				height: 100%;
			}

			/* image */
			#myCarousel > jehon-image-loading {
				width: 100%;
				height: 100%;
				object-fit: contain;
			}

			/* commands */
			#overlay {
				position: absolute;
				top: 0;
				left: 0;

				z-index: 100;

				width: 100%;
				height: 100%;

				display: grid;

				grid-template-areas:
					"left . right"
					"left center right"
					"left bottom right";
				grid-template-rows: 75% auto 10%;
				grid-template-columns: 40px auto 40px;

				justify-items: stretch;
			}

			#overlay > * {
				place-self: center;
				text-shadow: 1px 1px 2px black, 0 0 1em grey, 0 0 0.2em grey
			}

			#prev, #next {
				font-size: 40px;
			}

			#infos {
				text-align: center;
				vertical-align: middle;
			}

			#thumbs {
				grid-area: center;

				position: absolute;

				max-height: 50px;
				margin-bottom: 0.5rem;
			}

			#thumbs > .active {
				background-color: gray;
				border-radius: 2px;
				border: solid 2px gray;
			}

			#thumbs > #thumbnail {
				display: block;
				height: 100%;
				width: 100%;
				object-fit: contain;
			}
		</style>
		<div id="myCarousel">
			<jehon-image-loading></jehon-image-loading>
			<div id="overlay">
				<div style="grid-area: left"   id="prev"   class="hide-on-inactive">&lt;</div>
				<div style="grid-area: right"  id="next"   class="hide-on-inactive">&gt;</div>
				<div style="grid-area: bottom" id="infos"  ></div>
				<div style="grid-area: center" id="thumbs" class="hide-on-inactive"></div>
			</div>
		</div>`;

    this.#carouselImg = this.shadowRoot.querySelector('jehon-image-loading');
    this.#carouselInfos = this.shadowRoot.querySelector('#infos');

    this.shadowRoot.querySelector('#prev').addEventListener('click', () => prev());
    this.shadowRoot.querySelector('#next').addEventListener('click', () => next());

    this.addEventListener('wheel', (event) => {
      event.preventDefault();
      const d = event.deltaY;
      if (d < 0) {
        prev();
      } else {
        next();
      }
    });
  }

  stateChanged(status) {
    if (!this.#carouselImg) {
      return;
    }


    if (status.server.listing.length > 0) {
      let photo = status.server.listing[status.pictureIndex];

      app.debug('updatePicture', status.pictureIndex, photo);
      this.#carouselInfos.innerHTML = `${photo.data.title ?? ''}<br>${('' + (photo.data.date ?? '')).substring(0, 10)}`;
      this.#carouselImg.loadAndDisplayImage(photo.url);
    }

    this.shadowRoot.querySelectorAll('.hide-on-inactive').forEach(el => {
      if (status.active) {
        el.removeAttribute('inactive');
      } else {
        el.setAttribute('inactive', 'inactive');
      }
    });
  }
}

customElements.define('kiosk-photo-frame-main-element', KioskPhotoFrameMainElement);

app
  .setState({
    pictureIndex: 0,
    picturesList: [],
    active: false
  })
  .setMainElementBuilder(() => new KioskPhotoFrameMainElement())
  .menuBasedOnIcon('../packages/photo-frame/photo-frame.png')
  .setPriority(priorities.photoFrame.normal);

app
  .onStateChange((status, app) => {
    app.debug('Setting priorities according to listing');
    if (!status || !status.server) {
      return;
    }
    if (status.server.hasList) {
      app.setPriority(priorities.photoFrame.elevated);
    } else {
      app.setPriority(priorities.photoFrame.normal);
    }
  });

humanActiveStatus.onChange(active => {
  const status = app.getState();
  status.active = active;
  app.setState(status);
});

export default app;
