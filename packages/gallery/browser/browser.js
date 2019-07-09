
import { myFetch, dirname } from '../utils.js';
import { listing } from './listing.js';
import '../client-lib/view.js';
import '../client-lib/panorama.js';

const mainApp = document.querySelector('#main_application');

function mainHeader() {
	const menu = document.createElement('div');
	menu.setAttribute('id', 'browser_header');
	if (dirname(location.pathname)) {
		menu.insertAdjacentHTML('beforeend', '<a href="../.html" class="button"><img src="/img/parent.svg" style="height: 40px"></a>');
	}
	return menu;
}

myFetch('.json', { format: 'json' }).then(data => {
	mainApp.insertAdjacentElement('beforeend', mainHeader());

	if ('folder' in data.byTypes) {
		mainApp.insertAdjacentElement('beforeend', listing(data.byTypes.folder));
	}

	if ('image' in data.byTypes) {
		mainApp.insertAdjacentElement('beforeend', listing(data.byTypes.image));
	}
});

//
// Actions possible:
//   - see it today (add to listing.json + reload) ==> how is the frame listing.json generated?
//   - flag as favorite
//   - flag as delete
//   - flag as inappropriate
//   - send it by telegram
//
