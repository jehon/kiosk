
/**
	 *  Send back a proxy that will treat the first argument as a contextualized string
	 *    - .* => add the context as first
	 *    - [^.] => treat as global key
	 */

export default function contextualize(context) {
	return function(key) {
		if ((typeof(key) == 'string' && key[0] == '.')
				|| (key === undefined)) {
			// We are in a .* string, add context in front
			if (key == '.' || key === undefined) {
				return context;
			}
			return context + key;
		}

		// Other case
		return key;
	};
}

export function ctxForFunction(context) {
	// Return a function to apply on contextualization function
	return (fn) =>
		// The new function will have its first argument contextualized
		(key, ...args) => {
			return fn(contextualize(context)(key), ...args);
		};
}
