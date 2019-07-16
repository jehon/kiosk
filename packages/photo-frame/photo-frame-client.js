
// http://idangero.us/swiper/api/
import '/node_modules/swiper/dist/js/swiper.min.js';

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
	get kioskEventListeners() {
		return {
			'.list.changed': () => this.adaptList(),
			'.picture.changed': (i) => this.adaptPicture(i)
		};
	}

	render() {
		this.attachShadow({ mode: 'open' });
		this.shadowRoot.innerHTML = `
			<link rel="stylesheet" href="/node_modules/swiper/dist/css/swiper.min.css">
			<style>
				.swiper-container {
					height: 100%;
				}

				.swiper-slide {
					height: 100%;
					position: relative;
				}

				.swiper-slide img {
					object-fit: contain;
					height: 100%;
					width: 100%;
				}

				.swiper-slide .tag {
					position: absolute;
					z-index: 999;
					margin: 0 auto;
					left: 0;
					right: 0;
					top: 0;
					text-align: center;
				}
				.tag span {
					background-color: gray;
					padding: 15px;
					border-top: 15px gray solid;
					border-bottom-left-radius: 10px;
					border-bottom-right-radius: 10px;
				}
			</style>
			<div class="swiper-container">
				<div class="swiper-wrapper" id="slides">
					<div class="swiper-slide">Waiting for pictures</div>
				</div>
				<div class="swiper-pagination"></div>
				<div class="swiper-button-prev"></div>
				<div class="swiper-button-next"></div>
			</div>
		`;

		/* global Swiper */
		this.mySwiper = new Swiper(this.shadowRoot.querySelector('.swiper-container'), {
			loop: true,

			pagination: {
				el: this.shadowRoot.querySelector('.swiper-pagination'),
			},

			navigation: {
				nextEl: this.shadowRoot.querySelector('.swiper-button-next'),
				prevEl: this.shadowRoot.querySelector('.swiper-button-prev'),
			},
		});

		this.mySwiper.on('slideChange', () => {
			let i = this.mySwiper.realIndex;
			if (i != pictureIndex) {
				pictureIndex = i;
				app.dispatch('.picture.changed');
			}
		});
	}

	adaptList() {
		if (picturesList.length < 1) {
			return;
		}
		this.mySwiper.removeAllSlides();
		// TODO: date legend: should be clean up for not significant numbers!
		this.mySwiper.appendSlide(picturesList.map(v =>
			`<div class="swiper-slide">
				<img src="${v.webname}" />
				<div class="tag"><span>${v.data.comment} ${v.data.date ? v.data.date: ''}</span></div>
			</div>
			`
		));
	}

	adaptPicture() {
		let i = this.mySwiper.realIndex;
		if (i != pictureIndex) {
			this.mySwiper.slideToLoop(pictureIndex);
		}
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
