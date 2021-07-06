
import ClientAppElement from '../../client/client-app-element.js';
import { ClientApp } from '../../client/client-app.js';
import { priorities } from '../../client/config.js';
import Callback from '../../common/callback.js';

// The index of the current pictuer
let pictureIndex = 0;
// The list of pictures
let picturesList = [];

// For manual selection
let updatePictureTimeout = null;
let updatePictureCallback = new Callback(0);

// Select the next picture
/**
 *
 */
function autoMoveToNextImage() {
	app.debug('autoMoveToNextImage', pictureIndex);
	if (updatePictureTimeout) {
		clearTimeout(updatePictureTimeout);
	}
	if (picturesList.length == 0) {
		// Wait for a new list
		return;
	} else {
		next();
	}

	updatePictureTimeout = setTimeout(autoMoveToNextImage, 15 * 1000);
}

/**
 * @returns {number} the next index
 */
function next() {
	pictureIndex++;
	if (pictureIndex >= picturesList.length) {
		pictureIndex = 0;
	}

	updatePictureCallback.emit(pictureIndex);
	return pictureIndex;
}

/**
 * @returns {number} the previous index
 */
function prev() {
	pictureIndex--;
	if (pictureIndex < 0) {
		pictureIndex = picturesList.length - 1;
	}

	updatePictureCallback.emit(pictureIndex);
	return pictureIndex;
}

class KioskPhotoFrame extends ClientAppElement {
	carousel = null

	constructor() {
		super();

		this.attachShadow({ mode: 'open' });
		this.shadowRoot.innerHTML = `
		<style>
			:host-context(body[inactive]) .hideOnInactive {
				display: none;
			}

			:host-context(body[nodebug]) .debug {
				display: none;
			}

			#myCarousel {
				position: relative;
				width: 100%;
				height: 100%;
			}

			/* image */
			#myCarousel > #img {
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
			<img id="img" />
			<div id="overlay">
				<div style="grid-area: left"   id="prev"   class="hideOnInactive">&lt;</div>
				<div style="grid-area: right"  id="next"   class="hideOnInactive">&gt;</div>
				<div style="grid-area: bottom" id="infos"  ></div>
				<div style="grid-area: center" id="thumbs" class="hideOnInactive">thumbs</div>
			</div>
		</div>`;

		this._carouselImg = /** @type {HTMLImageElement} */ (this.shadowRoot.querySelector('#img'));
		this._carouselInfos = this.shadowRoot.querySelector('#infos');
		this._carouselThumbs = this.shadowRoot.querySelector('#thumbs');

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

	connectedCallback() {
		super.connectedCallback();
		this.addUnregister(
			updatePictureCallback.onChange(
				() => this.updatePicture()
			)
		);
	}

	onServerStateChanged() {
		this._carouselThumbs.innerHTML = '';
		if (picturesList.length >= 1) {
			// TODO: manage thumbnails ! => need to generate them !

			// this.carousel.content.innerHTML = '';
			// this.carousel.thumbs.innerHTML = '';

			// for (let i = 0; i < picturesList.length; i++) {
			// 	const v = picturesList[i];
			// 	// TODO: date legend: should be clean up for not significant numbers!
			// 	this.carousel.content.insertAdjacentHTML('beforeend',
			// 		`<div class="carousel-item " data-slide-number="${i}">
			// 			<pre class="debug data" >${JSON.stringify(v, null, 4)}</pre>
			// 			<img src="${v.url}">
			// 			<div class="hideOnInactive carousel-caption d-none d-md-block">
			// 				<h5>${v.data.comment}</h5>
			// 				<p>${v.data.date}</p>
			// 			</div>
			// 		</div>`);

			// 	this.carousel.thumbs.insertAdjacentHTML('beforeend',
			// 		`<div class="thumb" data-target="#myCarousel" data-slide-to="${i}">
			// 			<img src="${v.url}?thumb=1&height=50">
			// 		</div>`);
			// }
			// this.carousel.content.querySelector('[data-slide-number="0"]').classList.add('active');
			// this.carousel.thumbs.querySelector('[data-slide-to="0"]').classList.add('active');
			// this.carousel.thumbs.querySelectorAll('[data-slide-to]').forEach(el =>
			// 	el.addEventListener('click', () => this.carousel.mainFn(parseInt(el.dataset.slideTo))));
		}

		this.updatePicture();
	}

	updatePicture() {
		if (!this._carouselImg) {
			return;
		}

		let photo = {
			url: '../packages/photo-frame/photo-frame.png',
			data: {
				comment: 'no picture',
				date: 'today'
			}
		};

		if (picturesList.length > 0) {
			photo = picturesList[pictureIndex];
		}
		app.debug('updatePicture', pictureIndex);

		this._carouselInfos.innerHTML = `${photo.data.comment ?? ''}<br>${('' + (photo.data.date ?? '')).substring(0, 10)}`;

		this._carouselImg.src = photo.url;
	}
}

customElements.define('kiosk-photo-frame', KioskPhotoFrame);

const app = new ClientApp('photo-frame')
	.setMainElementBuilder(() => new KioskPhotoFrame())
	.menuBasedOnIcon('../packages/photo-frame/photo-frame.png')
	.setPriority(priorities.photoFrame.normal);

app.onServerStateChanged((status, app) => {
	app.debug('Refreshing listing');
	if (!status.hasList) {
		return;
	}

	app.setPriority(priorities.photoFrame.elevated);

	picturesList = status.listing;
	pictureIndex = 0;

	app.debug('New listing has ', picturesList.length);

	autoMoveToNextImage();
});
export default app;
