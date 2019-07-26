
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
			'.list.changed': () => this.adaptList()
		};
	}

	render() {
		this.attachShadow({ mode: 'open' });
		this.shadowRoot.innerHTML = `
		<link rel='stylesheet' type='text/css' href='/node_modules/bootstrap/dist/css/bootstrap.min.css'>
		<div class="container py-2">
			<div class="row">
				<div class="col-lg-8 offset-lg-2" id="slider">
					<div id="myCarousel" class="carousel slide">

						<!-- main slider carousel items -->
						<div class="carousel-inner" id="content">
							<div class="active carousel-item" data-slide-number="0">
								<img src="http://placehold.it/1200x480&amp;text=one" class="img-fluid">
							</div>
							<div class="carousel-item" data-slide-number="1">
								Waiting for pictures
							</div>
							<a class="carousel-control-prev" href="#myCarousel" role="button" data-slide="prev">
								<span class="carousel-control-prev-icon" aria-hidden="true"></span>
								<span class="sr-only">Previous</span>
							</a>
							<a class="carousel-control-next" href="#myCarousel" role="button" data-slide="next">
								<span class="carousel-control-next-icon" aria-hidden="true"></span>
								<span class="sr-only">Next</span>
							</a>
						</div>
						<!-- main slider carousel nav controls -->


						<ul class="carousel-indicators list-inline mx-auto border px-2">
							<li class="list-inline-item active">
								<a id="carousel-selector-0" class="selected" data-slide-to="0" data-target="#myCarousel">
									<img src="http://placehold.it/80x60&amp;text=one" class="img-fluid">
								</a>
							</li>
						</ul>
					</div>
				</div>
			</div>
		</div>`;

		this.carousel = {
			content: this.shadowRoot.querySelector('#content')
		};
		console.log('carousel: ', this.carousel);

		// https://getbootstrap.com/docs/4.0/components/carousel/
	}

	adaptList() {
		if (picturesList.length < 1) {
			return;
		}
		if (!this.carousel) {
			return;
		}
		this.carousel.content.innerHTML = '';
		for(let i = 0; i < picturesList.length; i++) {
			const v = picturesList[i];
			console.log(i, v);
			// TODO: date legend: should be clean up for not significant numbers!
			this.carousel.content.insertAdjacentHTML('beforeend',
				`<div class="carousel-item" data-slide-number="${i}">
					<img src="${v.webname}" class="img-fluid">
				</div>`);

			// <div class="carousel-caption d-none d-md-block">
			// 	<h5>v.data.comment</h5>
			// 	<p>v.data.date</p>
			// </div>
		}
		this.carousel.content.querySelector('[data-slide-number="0"]').classList.add('active');
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
