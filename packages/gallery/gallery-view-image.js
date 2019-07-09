
import GalleryViewGeneric from './gallery-view-generic.js';

export default class GalleryViewImage extends GalleryViewGeneric {
	getImageUrl(url, height) {
		return `${url}?thumb&height=${height}`;
	}
}

customElements.define('gallery-view-image', GalleryViewImage);
