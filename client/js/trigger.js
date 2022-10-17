
/**
 * Trigger the event on the object
 *
 * @param {Element} el receiving the evet
 * @param {string} eventName to be triggered
 * @param {any} data associated
 */
export default function (el, eventName, data = undefined) {
    el.dispatchEvent(new CustomEvent(eventName, { detail: data }));
}