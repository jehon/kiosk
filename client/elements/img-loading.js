
function dispatchEvent(elem, name) {
	var event = new Event(name);
	elem.dispatchEvent(event);
}

class KioskImgLoading extends HTMLImageElement {
	connectedCallback() {
		this.setAttribute('loading', 'loading');
		dispatchEvent(this, 'loading');
		this.addEventListener('load', () => {
			this.removeAttribute('loading');
			dispatchEvent(this, 'loaded');
		});
	}
}

customElements.define('kiosk-img-loading', KioskImgLoading, { extends: 'img' });
