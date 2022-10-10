
class KioskImgLoading extends HTMLElement {
	static get observedAttributes() {
		return ['src'];
	}

	#imgs;

	constructor() {
		super();
		this.attachShadow({ mode: 'open' });
		this.shadowRoot.innerHTML = `
			<style>
				img {
					width:  100%;
					height: 100%;
					object-fit: contain;
				}

				img[state="loading"] {
					display: none;
				}
			</style>
			<img id=1 state=current loading />
			<img id=2 state=loading />
			<slot></slot>
		`;

		this.#imgs = Object.values(this.shadowRoot.querySelectorAll('img'));

		this.shadowRoot.querySelectorAll('img').forEach(el =>
			el.addEventListener('load', () => {
				if (el.getAttribute('state') != 'loading') {
					// The image is the current image
					return;
				}
				const other = this.#imgs.filter(v => v != el)[0];

				other.setAttribute('state', 'loading');
				el.setAttribute('state', 'current');
			})
		);

	}

	attributeChangedCallback(name, oldValue, newValue) {
		switch (name) {
			case 'src':
				if (oldValue != newValue) {
					this.shadowRoot.querySelector('[state="loading"]').setAttribute('src', newValue);
				}
				break;
		}
	}
}

customElements.define('kiosk-img-loading', KioskImgLoading);
