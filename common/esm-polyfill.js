
import path from 'path';
import { parse } from 'url';
import url from 'url';

function getModuleStack(skipIntermediaryModules = 0) {
	// Thanks to https://stackoverflow.com/a/19788257/1954789
	var err = new Error();
	Error.prepareStackTrace = function (_err, stack) { return stack; };

	let skipped = 0;
	let skipfile = err.stack.shift().getFileName();
	if (skipIntermediaryModules < 0) {
		skipfile = '';
	}

	while (err.stack.length) {
		const modulefile = err.stack.shift().getFileName();
		// log += '> ' + modulefile;
		if (skipfile != modulefile) {
			if (skipped >= skipIntermediaryModules) {
				return { modulefile: modulefile, stack: err.stack};
			}
			skipfile = modulefile;
			skipped++;
		}
	}
	// console.error('Problem: ', Error('euh'));
	// throw Error('Could not calculate the module stack: ' + log);
}

export function getModulePath(skipIntermediaryModules = 0) {
	// Thanks to https://stackoverflow.com/a/19788257/1954789
	const { modulefile } = getModuleStack(skipIntermediaryModules);
	return parse(modulefile).href;
}

export function getModuleBasename(skipIntermediaryModules = 0) {
	return path.basename(getModulePath(skipIntermediaryModules));
}

export function getModuleDirname(skipIntermediaryModules = 0) {
	return url.fileURLToPath(path.dirname(getModulePath(skipIntermediaryModules)));
}

export const rootDir = path.dirname(getModuleDirname(-1));
