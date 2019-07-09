
import GalleryViewGeneric from './gallery-view-generic.js';

export default class GalleryViewFolder extends GalleryViewGeneric {
	getImageUrl(_url, _height) {
		return '/packages/gallery/folder.svg';
	}
}

customElements.define('gallery-view-folder', GalleryViewFolder);
