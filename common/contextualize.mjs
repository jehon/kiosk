
/**
 * Create a function that will transform the parameter as a contextualized string
 *
 *    - .* => add the context as first
 *    - [^.] => treat as global key
 *
 * Example
 *   ".truc" => "ctx.truc"
 *
 * @param {string} context to which we contextualize
 * @returns {function(string): string} that will contextualize strings
 */
export default function contextualize(context) {
	return function (key) {
		if ((typeof (key) == 'string' && key[0] == '.')
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

// /**
//  * @param context
//  */
// export function ctxForFunction(context) {
// 	// Return a function to apply on contextualization function
// 	return (fn) =>
// 		// The new function will have its first argument contextualized
// 		(key, ...args) => {
// 			return fn(contextualize(context)(key), ...args);
// 		};
// }
