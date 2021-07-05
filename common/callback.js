
/**
 * @param {any} value to be cloned
 * @returns {any} value
 */
function clone(value) {
	return value;
}

/**
 * @param {any} v1 to be compared
 * @param {any} v2 to be compared
 * @returns {boolean} if equal
 */
function equals(v1, v2) {
	return v1 == v2;
}

export default class Callback {
	#state;
	#subscribers = [];

	constructor(value = undefined) {
		this.#state = value;
	}

	getState() {
		return this.#state;
	}

	onChange(callback) {
		this.#subscribers.push(callback);
		if (this.#state !== undefined) {
			callback(this.#state, undefined);
		}

		// This returns the unsubscribe handler
		return () => {
			this.#subscribers = this.#subscribers.filter(v => v !== callback);
		};
	}

	async emit(newValue) {
		const prevValue = this.#state;
		if (equals(prevValue, newValue)) {
			return false;
		}
		this.#state = clone(newValue);

		return Promise.all(this.#subscribers.map(cb => cb(clone(newValue), clone(prevValue))));
	}
}
