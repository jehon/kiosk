
import { spawnSync } from 'child_process';

const translation = {
	'Exif.Photo.UserComment': 'comment',
	'Exif.Photo.DateTimeOriginal': 'date',
	'Exif.Image.Orientation': 'orientation'
};

function runExiv(...params) {
	//
	// Error here ? check exiv is installed :-)
	//
	let processResult = spawnSync('exiv2', params);
	switch(processResult.status) {
	case 0:   // ok, continue
		break;
	case 1:   // The file contains data of an unknown image type
	case 253: // No exif data found in file
		return '';
	case 255: // File does not exists
		return '';
	default:
		throw new Error('\n\nrunExiv process: ' + processResult.status + ' with [ ' + params.join(' , ') + ' ] => '
			+ (processResult.stderr ? processResult.stderr.toString() : 'no error message'));
	}
	if (processResult.stdout != null) {
		return processResult.stdout.toString();
	}
	return '';
}

export default async function exivReadAll(filePath) {
	const data = runExiv('-g', 'Exif.*', filePath);
	const result = {
		'comment': '',
		'date': null,
		'orientation': 0
	};
	data.split('\n').forEach(line => {
		let k = line.split(' ')[0].trim();
		if (k in translation) {
			k = translation[k];
		}

		let v = line.substr(60).replace(/\0/g, '').trim();
		if (v == '(Binary value suppressed)') {
			v = '';
		}

		if (v) {
			result[k] = v;
			if (v.match(/[0-9]{4}:[0-9]{2}:[0-9]{2} [0-9]{2}:[0-9]{2}:[0-9]{2}/)) {
				// Match the date element
				const nd = new Date(v.replace(':', '-').replace(':', '-'));
				if (!isNaN(nd)) {
					result[k] = nd;
				}
			}
		}

	});
	return result;
}
