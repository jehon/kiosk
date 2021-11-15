
import ClientAppElement from '../../client/client-app-element.js';
import { ClientApp } from '../../client/client-app.js';
import { priorities } from '../../client/config.js';
import Callback from '../../common/callback.js';
import Delayed from '../../common/Delayed.js';
import TimeInterval from '../../common/TimeInterval.js';

const app = new ClientApp('photo-frame');

// The index of the current pictuer
let pictureIndex = 0;
// The list of pictures
let picturesList = [];

// For manual selection
let updatePictureCallback = new Callback(0);

// Select the next picture
/**
 *
 */
function autoMoveToNextImage() {
	app.debug('autoMoveToNextImage', pictureIndex);
	if (picturesList.length == 0) {
		// Wait for a new list
		return;
	} else {
		next();
	}
}

const timer = new TimeInterval(() => autoMoveToNextImage(), 15, app);
timer.start();

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

	/** @type {HTMLElement} */
	_carouselImg;

	/** @type {HTMLElement} */
	_carouselInfos;

	/** @type {HTMLElement} */
	_carouselThumbs;

	/** @type {HTMLElement} */
	_debug;

	constructor() {
		super(app);

		this.attachShadow({ mode: 'open' });
		this.shadowRoot.innerHTML = `
		<jehon-css-inherit></jehon-css-inherit>
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
		<pre class='debug'>debug infos</pre>
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
		this._debug = this.shadowRoot.querySelector('.debug');

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
		let delayingUpdate = new Delayed(() => this.updatePicture(), 0.25, this.log);
		this.addUnregister(
			updatePictureCallback.onChange(() => delayingUpdate.start())
		);
	}

	onServerStateChanged() {
		this._carouselThumbs.innerHTML = '';
		if (picturesList.length >= 1) {
			// TODO: manage thumbnails ! => need to generate them !
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
			if (this._carouselImg.getAttribute('src') != photo.url) {
				app.debug('updatePicture', pictureIndex);
				photo = picturesList[pictureIndex];
				this._carouselInfos.innerHTML = `${photo.data.comment ?? ''}<br>${('' + (photo.data.date ?? '')).substring(0, 10)}`;
				this._carouselImg.setAttribute('src', photo.url);
			}
		}

		this._debug.innerHTML = JSON.stringify(photo, null, 2);
	}
}

customElements.define('kiosk-photo-frame', KioskPhotoFrame);

app
	.setMainElementBuilder(() => new KioskPhotoFrame())
	.menuBasedOnIcon('../packages/photo-frame/photo-frame.png')
	.setPriority(priorities.photoFrame.normal);

app
	.onServerStateChanged((status, app) => {
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
