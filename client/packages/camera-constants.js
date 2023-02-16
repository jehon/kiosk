/**
 * @readonly
 * @enum {string}
 */
export const TriStates = {
  /** Could show the video feed */
  READY: "READY",
  /** Camera is up, but video feed is not ready */
  UP_NOT_READY: "UP_NOT_READY",
  /** Camera is completely down */
  DOWN: "DOWN"
};
Object.freeze(TriStates);

/**
 * @typedef CheckResponse
 * @property {TriStates} state - the state of the camera
 * @property {string} message  - a message to show to the user
 */

export class CameraAPI {
  constructor(app, config) {
    this.app = app;
    this.config = {
      host: "localhost",
      port: 80,
      username: "",
      password: "",
      nbCheck: 2,
      ...this.defaultConfig(),
      ...config
    };
  }

  defaultConfig() {
    return {};
  }

  debug(...args) {
    this.app.debug(...args);
  }

  info(...args) {
    this.app.info(...args);
  }

  log(...args) {
    this.app.log(...args);
  }

  /**
   * check if the camera is up and running
   *
   * @returns {Promise<void>} resolve if success, reject (with the fetch error if present) in any other case
   */
  async check() {}

  /**
   * turn up the camera
   *
   * @returns {Promise<string>} with the url of the video
   */
  async up() {
    return "";
  }

  /**
   * turn down the camera
   */
  async down() {}
}
