
class CssInherit extends HTMLElement {
	connectedCallback() {
		this.update();
	}

	update() {
		// Reset
		this.innerHTML = '';

		let root = this
			.getRootNode({ composed: false })
			.host
			.getRootNode({ composed: false });

		root.querySelectorAll('style, link').forEach(el => {
			const node = el.cloneNode(true);
			this.insertAdjacentElement('beforeend', node);
		});
	}
}

customElements.define('x-css-inherit', CssInherit);
