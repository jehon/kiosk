/* global moment */

// clock-client
export async function onDate(date) {
	return new Promise((resolve, _reject) => {
		if (typeof(onDate) == 'string') {
			date = new Date(date);
		}
		const now = new Date();
		if (date < now) {
			return resolve();
		}
		setTimeout(() => resolve(), date - now);
	});
}

export function withTS(url) {
	return url
		+ (url.indexOf('?') >= 0 ? '&' : '?')
		+ `random-no-cache=${Math.floor((1 + Math.random()) * 0x10000).toString(16)}`;
}

export function mydate2str(d) {
	if (!d) {
		return '';
	}
	return moment(d.split(/[ -]/)).locale('fr').format('DD MMMM YYYY hh:mm:ss');
}

// export function dirname(path) {
// 	let list = path.split('/');
// 	if (list.length == 2) { // /brol => [ "", "brol" ]
// 		return false;
// 	}
// 	list.pop();
// 	return list.join('/');
// }

// // Legacy?
// export function generateButton(text, imgUrl = null) {
// 	let element = document.createElement('div');
// 	element.classList.add('button');
// 	element.classList.add('full-background-image');
// 	element.style.backgroundImage = `url('${imgUrl}')`;
// 	element.innerHTML = `<span>${text}</span>`;
// 	return element;
// }
