
import '/node_modules/bootstrap/dist/js/bootstrap.bundle.min.js';

import AppFactory, { renderMixin } from '../../client/client-api.js';

const app = AppFactory('photo-frame');

let pictureIndex = 0;
let picturesList = [];
let updatePictureTimeout = false;

function next(i) {
	let res = i + 1;
	if (res >= picturesList.length) {
		res = 0;
	}
	return res;
}

function prev(i) {
	let res = i - 1;
	if (res <= 0) {
		res = picturesList.length - 1;
	}
	return res;
}


// Select the next picture
function updatePicture() {
	if (updatePictureTimeout) {
		clearTimeout(updatePictureTimeout);
	}
	if (picturesList.length == 0) {
		// Wait for a new list
		return;
	} else {
		pictureIndex = next(pictureIndex);
		app.dispatch('.picture.changed', pictureIndex);
	}
	updatePictureTimeout= setTimeout(updatePicture, 15 * 1000);
}

class KioskPhotoFrame extends app.getKioskEventListenerMixin()(renderMixin(HTMLElement)) {
	carousel = false

	get kioskEventListeners() {
		return {
			'caffeine.activity': active => this.adaptToActivity(active),
			'.list.changed': () => this.adaptList(),
			'.picture.changed': () => this.changePicture(),
		};
	}

	render() {
		this.attachShadow({ mode: 'open' });
		// See https://getbootstrap.com/docs/4.0/components/carousel/
		this.shadowRoot.innerHTML = `
		<link rel='stylesheet' type='text/css' href='/node_modules/bootstrap/dist/css/bootstrap.min.css'>
		<style>
			:host(.inactive) whenActivity {
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
				text-shadow: 0 2px 0 black;
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
			<ol class="whenActivity carousel-indicators" id="thumbs"></ol>

			<!-- carousel navigation -->
			<a class="whenActivity carousel-control-prev" href="#myCarousel" role="button" data-slide="prev">
				<span class="carousel-control-prev-icon" aria-hidden="true"></span>
				<span class="sr-only">Previous</span>
			</a>
			<a class="whenActivity carousel-control-next" role="button" data-slide="next">
				<span class="carousel-control-next-icon" aria-hidden="true"></span>
				<span class="sr-only">Next</span>
			</a>
		</div>`;

		this.carousel = {
			main: this.shadowRoot.querySelector('#myCarousel'),
			main$: $(this.carousel.main),
			mainFn: (cmd) => $(this.carousel.main).carousel(cmd),
			content: this.shadowRoot.querySelector('#content'),
			thumbs: this.shadowRoot.querySelector('#thumbs'),
			next: this.shadowRoot.querySelector('[data-slide="next"]'),
			prev: this.shadowRoot.querySelector('[data-slide="prev"]')
		};

		/* Next button */
		this.carousel.next.addEventListener('click', () => {
			pictureIndex = next(pictureIndex);
			app.dispatch('.picture.changed', pictureIndex);
		});

		/* Previous button */
		this.carousel.prev.addEventListener('click', () => {
			pictureIndex = prev(pictureIndex);
			app.dispatch('.picture.changed', pictureIndex);
		});

		/* global $ */
		this.carousel.mainFn({
			interval: false
		});

		// https://getbootstrap.com/docs/4.0/components/carousel/
		this.adaptList();
	}

	adaptList() {
		if (!this.isRendered()) {
			return;
		}
		if (picturesList.length < 1) {
			return;
		}
		this.carousel.content.innerHTML = '';
		this.carousel.thumbs.innerHTML = '';

		for(let i = 0; i < picturesList.length; i++) {
			const v = picturesList[i];
			// TODO: date legend: should be clean up for not significant numbers!
			this.carousel.content.insertAdjacentHTML('beforeend',
				`<div class="carousel-item " data-slide-number="${i}">
					<img src="${v.webname}">
					<div class="whenActivity carousel-caption d-none d-md-block">
						<h5>${v.data.comment}</h5>
						<p>${v.data.date}</p>
					</div>
				</div>`);

			this.carousel.thumbs.insertAdjacentHTML('beforeend',
				`<div class="thumb" data-target="#myCarousel" data-slide-to="${i}">
					<img src="${v.webname}?thumb=1&height=50">
				</div>`);
		}
		this.carousel.content.querySelector('[data-slide-number="0"]').classList.add('active');
		this.carousel.thumbs.querySelector('[data-slide-to="0"]').classList.add('active');
		this.carousel.thumbs.querySelectorAll('[data-slide-to]').forEach(el =>
			el.addEventListener('click', () => this.carousel.mainFn(parseInt(el.dataset.slideTo))));
	}

	changePicture() {
		if (!this.carousel)	{
			return;
		}
		this.carousel.mainFn(pictureIndex);
	}

	adaptToActivity(active) {
		this.toggleAttribute('inactive', !active);
	}
}

customElements.define('kiosk-photo-frame', KioskPhotoFrame);

app.subscribe('.listing', listing => {
	picturesList = listing; //Object.keys(listing).map(function (key) { return listing[key]; });
	pictureIndex = -1;
	app.dispatch('.list.changed');
	updatePicture(); // Will reprogram it
});

app
	.withPriority(50)
	.withMainElement(new KioskPhotoFrame())
	.menuBasedOnIcon('/packages/photo-frame/photo-frame.png')
;
