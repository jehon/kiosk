/* eslint-ignore */

/**
 * From: http://forums.dlink.com/index.php?topic=58565.0
 * view functions:
  1   mvideo.htm      stream   admin or user
  2   lphone.htm      stream   admin or user
  3   mjpeg.cgi      stream   admin or user
  4   mobile.htm      still   admin or user
  5   iphone.htm      still   admin or user
  6   image/jpeg.cgi   still   admin or user
  V   video.cgi      stream   admin only?
  A   audio.cgi      audio   admin only?
 */

const btoa = require("btoa");
const { TriStates } = require("../camera-constants.js");
const fetch = /** @type {function(string, *):Promise} */ /** @type {*} */ (
  require("node-fetch")
);

/**
 * @type {module:packages/camera/CameraAPI}}
 */
const cameraAPI = {
  init: async function (app, config) {
    app.registerCredentials(config.host, config.username, config.password);
  },

  check: (config, _logger) => {
    config.imageFeed = "/image.jpg";
    config.videoFeed = "/video/mjpg.cgi";
    config.audioFeed = "/audio.cgi";

    const url = `${config.host}${
      config.imageFeed
    }?random-no-cache=${new Date().getTime()}`;
    const authHeader = "Basic " + btoa(config.username + ":" + config.password);

    // app.debug(`checking "${url}"`);
    const headers = new fetch.Headers({
      Authorization: authHeader
    });

    return fetch(url, { method: "GET", headers: headers }).then((response) => {
      /** @type {object} */
      if (response.ok) {
        return { state: TriStates.READY };
      }
      return {
        state: TriStates.UP_NOT_READY,
        message: response.status + ": " + response.statusText
      };
    });
  },

  generateFlow: function (_res) {}
};

module.exports = cameraAPI;
