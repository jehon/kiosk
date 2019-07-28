
import '/node_modules/bootstrap/dist/js/bootstrap.bundle.min.js';

import AppFactory, { renderMixin } from '../../client/client-api.js';

// import { mydate2str } from '../../client/client-helpers.js';

const app = AppFactory('photo-frame');

let pictureIndex = 0;
let picturesList = [];
let updatePictureTimeout = false;

function next(i) {
	let next = i + 1;
	if (next >= picturesList.length) {
		next = 0;
	}
	return next;
}

function url(i, escape = false) {
	if (i in picturesList) {
		let raw = `${picturesList[i].webname}`;
		if (escape) {
			raw = raw.split('\'').join('\\\'');
		}
		return raw;
	}
	return '';
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
			'.list.changed': () => this.adaptList(),
			'.picture.changed': () => this.changePicture()
		};
	}

	render() {
		this.attachShadow({ mode: 'open' });
		// See https://getbootstrap.com/docs/4.0/components/carousel/
		this.shadowRoot.innerHTML = `
		<link rel='stylesheet' type='text/css' href='/node_modules/bootstrap/dist/css/bootstrap.min.css'>
		<style>
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
				text-shadow: 0 1px 0 black;
				mix-blend-mode: difference;
			}

			.carousel-indicators {
				height: 40px;
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
			<ol class="carousel-indicators" id="thumbs"></ol>

			<!-- carousel navigation -->
			<a class="carousel-control-prev" href="#myCarousel" role="button" data-slide="prev">
				<span class="carousel-control-prev-icon" aria-hidden="true"></span>
				<span class="sr-only">Previous</span>
			</a>
			<a class="carousel-control-next" role="button" data-slide="next">
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
			prev: this.shadowRoot.querySelector('[data-slide="prev"]'),
		};

		this.carousel.next.addEventListener('click', () => this.carousel.mainFn('next'));
		this.carousel.prev.addEventListener('click', () => this.carousel.mainFn('prev'));

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
					<div class="carousel-caption d-none d-md-block">
						<h5>${v.data.comment}</h5>
						<p>${v.data.date}</p>
					</div>
				</div>`);

			this.carousel.thumbs.insertAdjacentHTML('beforeend',
				`<div data-target="#myCarousel" data-slide-to="${i}">
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
}

customElements.define('kiosk-photo-frame', KioskPhotoFrame);

class KioskPhotoFrameStatus extends app.getKioskEventListenerMixin()(renderMixin(HTMLElement)) {
	get kioskEventListeners() {
		return {
			'.picture.changed': () => this.adapt()
		};
	}

	adapt() {
		this.innerHTML = `
			<div class='full-background-image' style="background-image: url('${url(pictureIndex, true)}')"'></div>
		`;
	}
}

customElements.define('kiosk-photo-frame-status', KioskPhotoFrameStatus);

app.subscribe('.listing', listing => {
	picturesList = listing; //Object.keys(listing).map(function (key) { return listing[key]; });
	pictureIndex = -1;
	app.dispatch('.list.changed');
	updatePicture(); // Will reprogram it
});

app
	.withPriority(50)
	.withMainElement(new KioskPhotoFrame())
	.withStatusElement(new KioskPhotoFrameStatus())
;
