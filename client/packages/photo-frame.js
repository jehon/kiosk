import ClientElement from "../client-element.js";
import { ClientApp } from "../client-app.js";
import { priorities } from "../config.js";
import { humanActiveStatus } from "./human.js";
import "./photo-frame-image.js";

/**
 * @typedef ImageData
 * @param {string} subPath relative to the folderConfig home
 * @param {object} data where the file has been defined
 * @param {string} data.title from exiv
 * @param {string} data.date from exiv
 * @param {number} data.orientation from exiv
 * @param {string} url calculated client-side
 *
 * {
 *   subPath: 'f1/i1.png',
 *   path: 'tests/data/photo-frame/f1/i1.png',
 *   data: {
 *	   title: 'Test title here',
 *	   date: '2019-07-01 02:03:04',
 *	   orientation: 0
 * }
 */

const PhotoLibrairy = "/var/photos";
const IndexFile = PhotoLibrairy + "/index.json";

/*

Status (client)

{
	index: int
	active: boolean
}

*/

const app = new ClientApp("photo-frame");

/**
 * Get the index from the server
 *
 * @returns {object} of the images
 */
export async function loadList() {
  let index = [];
  try {
    index = await fetch(`${IndexFile}?ts=${Date.now()}`).then((response) =>
      response.json()
    );
    index.list.forEach((img) => {
      img.url = PhotoLibrairy + "/" + img.subPath;
    });
  } catch (e) {
    app.error(`Could not load from ${IndexFile}`, e);
    // ok
    return;
  }

  if (index.ts == app.getState()?.ts) {
    return;
  }

  app.mergeState({
    list: [],
    ...index,
    index: 0
  });
  return index;
}

/**
 * Select the next picture
 */
function autoMoveToNextImage() {
  const status = app.getState();
  if (status.list.length > 0) {
    next();
  }
}

/**
 * @returns {number} the next index
 */
function next() {
  const status = app.getState();
  status.index++;
  if (status.index >= status.list.length) {
    status.index = 0;
  }

  app.setState(status);
  return status.index;
}

/**
 * @returns {number} the previous index
 */
function prev() {
  const status = app.getState();
  status.index--;
  if (status.index < 0) {
    status.index = status.list.length - 1;
  }

  app.setState(status);
  return status.index;
}

class KioskPhotoFrameMainElement extends ClientElement {
  /** @type {HTMLElement} */
  #carousel;

  /** @type {HTMLElement} */
  #carouselInfos;

  ready() {
    this.shadowRoot.innerHTML = `
		<jehon-css-inherit></jehon-css-inherit>
		<style>
			.hide-on-inactive[inactive] {
				display: none;
			}

			#carousel {
				position: relative;
				width: 100%;
				height: 100%;
			}

			/* image - front */
			#carousel > photo-frame-image {
				width: 100%;
				height: 100%;
				object-fit: contain;
        background-color: black;
        opacity: 99%;
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
				text-shadow: 1px 1px 2px black, 0 0 1em grey, 0 0 0.2em grey;
			}

			#prev, #next {
				font-size: 40px;
			}
		</style>
		<div id="carousel">
      <div id="overlay">
				<div style="grid-area: left"   id="prev"   class="hide-on-inactive">&lt;</div>
				<div style="grid-area: right"  id="next"   class="hide-on-inactive">&gt;</div>
			</div>
      <photo-frame-image src="/client/packages/photo-frame.png"></photo-frame-image>
		</div>`;

    this.#carousel = this.shadowRoot.querySelector("#carousel");

    this.shadowRoot
      .querySelector("#prev")
      .addEventListener("click", () => prev());
    this.shadowRoot
      .querySelector("#next")
      .addEventListener("click", () => next());

    this.addEventListener("wheel", (event) => {
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
    if (!this.#carousel) {
      return;
    }

    if (status.list.length > 0) {
      let nextPhotoInfos = status.list[status.index];

      /* Build up the next image */
      const nextImg = document.createElement("photo-frame-image");
      nextImg.setAttribute("src", `${nextPhotoInfos.url}?ts=${status.ts}`);
      nextImg.setAttribute("title", nextPhotoInfos.data.title);
      nextImg.setAttribute("date", nextPhotoInfos.data.date.substring(0, 10));
      this.#carousel.insertAdjacentElement("beforeend", nextImg);

      setTimeout(
        () => {
          for (const k of Array.from(
            this.#carousel.querySelectorAll("photo-frame-image")
          ).slice(0, -1)) {
            k.remove();
          }
        },
        status.active ? 0 : app.getConfig(".transitionSecs", 5) * 1000
      );
    }

    this.shadowRoot.querySelectorAll(".hide-on-inactive").forEach((el) => {
      if (status.active) {
        el.removeAttribute("inactive");
      } else {
        el.setAttribute("inactive", "inactive");
      }
    });
  }
}

customElements.define(
  "kiosk-photo-frame-main-element",
  KioskPhotoFrameMainElement
);

app
  .setState({
    index: 0,
    active: false,
    list: []
  })
  .setMainElementBuilder(() => new KioskPhotoFrameMainElement())
  .menuBasedOnIcon("./packages/photo-frame.png")
  .setPriority(priorities.photoFrame.normal);

app.onStateChange((status) => {
  if (status && status.list.length > 0) {
    app.setPriority(priorities.photoFrame.elevated);
  } else {
    app.setPriority(priorities.photoFrame.normal);
  }
});

humanActiveStatus.onChange((active) => app.mergeState({ active }));

export default app;

// Refresh list every... (TODO: parameter)
setInterval(() => loadList(), 10 * 1000);
loadList();

// TODO: parameter + handle human interaction
setInterval(() => autoMoveToNextImage(), 15 * 1000);
