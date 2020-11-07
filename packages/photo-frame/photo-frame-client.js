
import '../../node_modules/bootstrap/dist/js/bootstrap.bundle.min.js';

import { ClientApp, ClientAppElement } from '../../client/client-app.js';

const app = new ClientApp('photo-frame');

const elevatedPriority = 100;

// The index of the current pictuer
let pictureIndex = 0;
// The list of pictures
let picturesList = [];

// For manual selection
let updatePictureTimeout = null;

/**
 * @returns {number} the next index
 */
function next() {
	let res = pictureIndex + 1;
	if (res >= picturesList.length) {
		res = 0;
	}

	pictureIndex = res;

	(/** @type {KioskPhotoFrame} */ (app.getMainElement())).updatePicture();

	return res;
}

/**
 * @returns {number} the previous index
 */
function prev() {
	let res = pictureIndex - 1;
	if (res < 0) {
		res = picturesList.length - 1;
	}

	pictureIndex = res;

	(/** @type {KioskPhotoFrame} */ (app.getMainElement())).updatePicture();

	return res;
}

class KioskPhotoFrame extends ClientAppElement {
	carousel = null

	constructor() {
		super();

		this.attachShadow({ mode: 'open' });
		// See https://getbootstrap.com/docs/4.0/components/carousel/
		this.shadowRoot.innerHTML = `
		<link rel='stylesheet' type='text/css' href='../node_modules/bootstrap/dist/css/bootstrap.min.css'>
		<style>
			:host-context(body[inactive]) .hideOnInactive {
				display: none;
			}

			:host-context(body[nodebug]) .debug {
				display: none;
			}

			#myCarousel {
				height: 100%;
			}
			.carousel-inner {
				height: 100%;
			}
			.carousel-item {
				height: 100%
			}
			.carousel-caption {
				text-shadow: 1px 1px 2px black, 0 0 1em grey, 0 0 0.2em grey
			}

			/* image */
			.data {
				position: absolute;
				top: 0;
				left: 0;
				color: white;
				background-color: gray;
			}

			/* thumbs */

			.carousel-indicators {
				max-height: 50px;
				margin-bottom: 0.5rem;
			}

			.thumb {
				/* border: white solid 2px; */
			}

			.thumb.active {
				background-color: gray;
				border-radius: 2px;
				border: solid 2px gray;
			}

			.carousel-item img,
			.carousel-indicators img {
				display: block;
				height: 100%;
				width: 100%;
				object-fit: contain;
			}

		</style>
		<div id="myCarousel" class="carousel slide">
			<!-- main content -->
			<div class="carousel-inner" id="content"></div>

			<!-- thumbs -->
			<ol class="hideOnInactive carousel-indicators" id="thumbs"></ol>

			<!-- carousel navigation -->
			<a class="hideOnInactive carousel-control-prev" href="#myCarousel" role="button" data-slide="prev">
				<span class="carousel-control-prev-icon" aria-hidden="true"></span>
				<span class="sr-only">Previous</span>
			</a>
			<a class="hideOnInactive carousel-control-next" role="button" data-slide="next">
				<span class="carousel-control-next-icon" aria-hidden="true"></span>
				<span class="sr-only">Next</span>
			</a>
		</div>`;

		this.carousel = {
			main: this.shadowRoot.querySelector('#myCarousel'),
			// main$: $(this.carousel.main),
			mainFn: (cmd) => $(this.carousel.main).carousel(cmd),
			content: this.shadowRoot.querySelector('#content'),
			thumbs: this.shadowRoot.querySelector('#thumbs'),
			next: this.shadowRoot.querySelector('[data-slide="next"]'),
			prev: this.shadowRoot.querySelector('[data-slide="prev"]')
		};

		/* Next button */
		this.carousel.next.addEventListener('click', () => {
			next();
		});

		/* Previous button */
		this.carousel.prev.addEventListener('click', () => {
			prev();
		});

		/* global $ */
		this.carousel.mainFn({
			interval: false
		});
	}

	// setServerState(status) {
	// 	super.setServerState(status);
	// 	this.adaptList();
	// }

	updateList() {
		if (picturesList.length < 1) {
			return;
		}
		this.carousel.content.innerHTML = '';
		this.carousel.thumbs.innerHTML = '';

		for (let i = 0; i < picturesList.length; i++) {
			const v = picturesList[i];
			// TODO: date legend: should be clean up for not significant numbers!
			this.carousel.content.insertAdjacentHTML('beforeend',
				`<div class="carousel-item " data-slide-number="${i}">
					<pre class="debug data" >${JSON.stringify(v, null, 4)}</pre>
					<img src="${v.url}">
					<div class="hideOnInactive carousel-caption d-none d-md-block">
						<h5>${v.data.comment}</h5>
						<p>${v.data.date}</p>
					</div>
				</div>`);

			this.carousel.thumbs.insertAdjacentHTML('beforeend',
				`<div class="thumb" data-target="#myCarousel" data-slide-to="${i}">
					<img src="${v.url}?thumb=1&height=50">
				</div>`);
		}
		this.carousel.content.querySelector('[data-slide-number="0"]').classList.add('active');
		this.carousel.thumbs.querySelector('[data-slide-to="0"]').classList.add('active');
		this.carousel.thumbs.querySelectorAll('[data-slide-to]').forEach(el =>
			el.addEventListener('click', () => this.carousel.mainFn(parseInt(el.dataset.slideTo))));
	}

	updatePicture() {
		if (!this.carousel) {
			return;
		}
		this.carousel.mainFn(pictureIndex);
	}
}

customElements.define('kiosk-photo-frame', KioskPhotoFrame);


// Select the next picture
/**
 *
 */
function autoMoveToNextImage() {
	app.debug('Selecting next picture', pictureIndex);
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

app
	.setMainElement(new KioskPhotoFrame())
	.menuBasedOnIcon('../packages/photo-frame/photo-frame.png')
	.onServerStateChanged((status) => {
		app.debug('Refreshing listing');
		if (!status.hasList) {
			return;
		}

		app.setPriority(elevatedPriority);

		picturesList = status.listing;
		pictureIndex = 0;

		app.debug('New listing has ', picturesList.length);
		(/** @type {KioskPhotoFrame} */ (app.getMainElement())).updateList();


		autoMoveToNextImage();
	});
