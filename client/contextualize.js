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
    if ((typeof key == "string" && key[0] == ".") || key === undefined) {
      // We are in a .* string, add context in front
      if (key == "." || key === undefined) {
        return context;
      }
      return context + key;
    }

    // Other case
    return key;
  };
}
