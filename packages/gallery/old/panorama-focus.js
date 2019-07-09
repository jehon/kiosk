
import { PolymerElement, html } from '/node_modules/@polymer/polymer/polymer-element.js';
import { mydate2str } from '../utils.js';

// Custom viewers
import './view-folder.js';
import './view-image.js';

export default class PanoramaFocus extends PolymerElement {
	static get properties() {
		return {
			list: Array,
			auto: Boolean,
			current: String
		};
	}

	static get template() {
		return html`
			<x-css-inherit></x-css-inherit>
			<style>
				.thumbs {
					width: [[thumbHeight]]px;
				}
			</style>
			<div class='corners full-background-image' style$="background-image: url('[[_calculateUrl(list, current, true)]]')">
				<div>	
					<div id='previous'>
						<x-view class='thumbs'
							height='[[thumbHeight]]'
							type='[[_getPrevious(list, current, "type")]]'
							url='[[_getPrevious(list, current, "name")]]'
							></x-view>'					
					</div>
					<div id='next'>
						<x-view class='thumbs'
							height='[[thumbHeight]]'
							type='[[_getNext(list, current, "type")]]'
							url='[[_getNext(list, current, "name")]]'
						></x-view>'					
					</div>
				</div>
				<div>
					<div class='box'>[[_get(list, current, "original")]]</div>
					<div class='box'>[[_get(list, current, "name")]]</div>
					<div class='box'>[[_get(list, current, "date")]]</div>
				</div>
			</div>
		</div>
	`;
	}

	constructor() {
		super();
		this.thumbHeight = '200';
		this.current = 0;
	}

	userWantSomeTime() {
		// TODO
	}

	_calculateUrl(list, i, escape = false) {
		if (i > list.length) {
			return '';
		}
		let raw = `${list[i].name}?thumb&height=800`;
		if (escape) {
			raw = raw.split('\'').join('\\\'');
		}
		return raw;
	}

	_get(list, i, field) {
		if (field == 'date') {
			return mydate2str(list[i].date);
		}
		return list[i][field];
	}

	_getPrevious(list, i, field) {
		if (list.length < 2) {
			i = 0;
		} else {
			i--;
			if (i < 0) {
				i = list.length - 1;
			}
		}
		return this._get(list, i, field);
	}

	_getNext(list, i, field) {
		if (list.length < 2) {
			i = 0;
		} else {
			i++;
			if (i >= list.length) {
				i = 0;
			}
		}
		return this._get(list, i, field);
	}

	// next() {
	// 	this.i = this._calculateNextIndex(this.list, this.i);
	// 	this.userWantSomeTime();
	// }

	// previous() {
	// 	this.i = this._calculatePreviousIndex(this.list, this.i);
	// 	this.userWantSomeTime();
	// }

	// select(i) {
	// 	this.current = i;
	// 	this.userWantSomeTime();
	// }

}

// const updateCB = new xxxx();
// function updatePicture() {
// 	if (picturesList.length == 0) {
// 		// Go fetch the list
// 		myFetchJSONUntilSuccess(withTS(`${root}/list.json`), 5000)
// 			.then(data => {
// 				picturesList = Object.keys(data).map(function (key) { return data[key]; });
// 				pictureIndex = 0;
// 				updateCB.fire(pictureIndex);
// 			});
// 		return;
// 	}
// 	pictureIndex = next(pictureIndex);
// 	updateCB.fire(pictureIndex);
// }
// updatePicture();
// setInterval(updatePicture, 15 * 1000);

customElements.define('x-panorama-focus', PanoramaFocus);
