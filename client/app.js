import Callback from "./callback.js";
import contextualize from "./contextualize.js";
import { Logger } from "./logger.js";
import { cloneDeep } from "../node_modules/lodash-es/lodash.js";
import yaml from "../node_modules/js-yaml/dist/js-yaml.mjs";

import Cron from "../node_modules/croner/dist/croner.min.mjs";
import { autoSelectApplication } from "./client-lib-chooser.js";
import { getByPath } from "../node_modules/dot-path-value/dist/index.esm.js";

let idGenerator = 1;

// Top-Level-Await is not working in Karma/Jasmine
let config = {};

/**
 * Load the config
 */
export async function loadConfig() {
  config = await fetch("/etc/kiosk.yml")
    .then((response) => response.text())
    .then((yml) => yaml.load(yml));
}

/**
 * @typedef {object} CronStats send for cron
 * @property {Date} when as date
 * @property {Date} end as date
 * @property {number} duration in minutes
 */

export default class App extends Logger {
  /** @type {number} */
  id;

  /** @type {function(string): string} */
  ctxize;

  /**
   * Register when internal state change
   *
   * @type {Callback}
   */
  #stateCallback;

  /**
   *
   * @param {string} name of the app
   * @param {*} initialState to initialize the state
   */
  constructor(name, initialState) {
    super(name);
    this.id = idGenerator++;
    this.name = name;
    this.ctxize = contextualize(name);
    this.#stateCallback = new Callback(initialState);
  }

  toJSON() {
    return this.name + "#" + this.id;
  }

  //
  //
  // Status
  //
  //

  /**
   * Dispatch a status to the browser
   *
   * @param {object} data as the new status
   * @returns {this} this
   */
  setState(data) {
    this.#stateCallback.emit(data);
    return this;
  }

  /**
   * @returns {object} the state of the application
   */
  getState() {
    return cloneDeep(this.#stateCallback.getState());
  }

  /**
   * Dispatch a status to the browser
   *
   * @param {object} data as the alteration
   * @returns {object} as the new status
   */
  mergeState(data) {
    const newState = {
      ...this.getState(),
      ...data
    };
    this.setState(newState);
    return newState;
  }

  /**
   * @param {function(object):void} cb to listen for change
   * @returns {function(void):void} to stop the listener
   */
  onStateChange(cb) {
    return this.#stateCallback.onChange((state) => cb(state, this));
  }

  //
  //
  // Configuration
  //
  //
  /**
   * @param {string} path to be found
   * @param {*} def - a default value if config is not set
   * @returns {*} the required object
   */
  getConfig(path = "", def = undefined) {
    const cpath = this.ctxize(path);
    if (cpath) {
      try {
        return getByPath(config, cpath) ?? def;
      } catch (_e) {
        return def;
      }
    }
    return JSON.parse(JSON.stringify(config));
  }

  dispatchAppChanged() {
    autoSelectApplication();
    return this;
  }

  //
  //
  // CRON
  //
  //

  /**
   * Program a cron scheduler
   *
   * @param {object} options to configure the cron
   * @param {string} options.cron 5 stars (min hours dom month[1-12] dow[0sun-6]) (if empty, make nothing [usefull for testing])
   * @param {number} [options.duration] in minutes
   * @param {function(CronStats,*):void} options.onCron callback
   * @param {function(CronStats,*):void} [options.onEnd] callback
   * @param {*} [options.context] to pass to the signal
   * @returns {Function} stop to halt the cron
   */
  cron(options) {
    if (!options.cron) {
      return () => {};
    }

    options = {
      duration: 0,
      onEnd: () => {},
      context: {},
      ...options
    };

    /**
     * When cron is triggered
     *
     * @param {Date} whenTriggered the start of the ticker (could be now)
     */
    const onCron = (whenTriggered) => {
      const stats = {
        start: whenTriggered,
        end: new Date(whenTriggered.getTime() + options.duration * 60 * 1000),
        duration: options.duration // minutes
      };

      try {
        options.onCron(options.context, stats);
      } catch (e) {
        this.error(`notifying on ${options.cron} gave an error: `, e);
      }

      if (options.duration) {
        this.#onDate(stats.end, () => options.onEnd(options.context, stats));
      }
    };

    //
    // What time is it now?
    //
    const now = new Date();
    now.setMilliseconds(0);

    const scheduler = Cron(options.cron, () => {
      onCron(new Date());
    });

    if (options.duration > 0) {
      //
      // We look in the back, to see if the last event is still running or not
      // The last event is running if
      //    - it is started less than "duration" minutes ago
      //
      // => look "duration" in the past, and see if a event should have start during
      //    that time
      //
      const lookBackUpto = new Date(now);
      lookBackUpto.setMinutes(
        lookBackUpto.getMinutes() - options.duration - 0.1
      );
      /** @type {Date} */
      const firstStart = scheduler.next(lookBackUpto);

      if (firstStart < now) {
        this.debug(
          `Initiating past cron for ${
            options.cron
          } about ${firstStart.toISOString()} with duration ${options.duration}`
        );
        onCron(firstStart);
      }
    }

    return () => scheduler.stop();
  }

  /**
   * Resolve a promise on a certain date
   *
   * @param {Date} date the date on which the promise will be resolved
   * @param {function(): void} cb to be called
   */
  async #onDate(date, cb) {
    if (typeof date == "string") {
      date = new Date(date);
    }

    const run = () => {
      try {
        cb();
      } catch (e) {
        this.error(`On date ${date} gave an error: `, e);
      }
    };

    const now = new Date();
    if (date < now) {
      this.debug(
        "onDate: but it was already in the past, triggering immediately"
      );
      return run();
    }
    Cron(date, run);
  }
}
