
import '../client-lib/view-generic.js';
import '../client-lib/panorama.js';

export function listing(data, header = false) {
	let element = document.createElement('div');
	element.classList.add('full');

	// Header
	if (header) {
		let elHeader = header();
		elHeader.classList.add('listing');
		element.insertAdjacentElement('beforeend', elHeader);
	}

	const panorama = document.createElement('x-panorama');
	panorama.list = data;
	element.insertAdjacentElement('beforeend', panorama);

	return element;
}
