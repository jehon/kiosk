
import TimeInterval from './TimeInterval.js';

export default class Delayed extends TimeInterval {
    _set(cb, time) {
        return setTimeout(cb, time);
    }

    _clear(timer) {
        return clearTimeout(timer);
    }
}
