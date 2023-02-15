import Express from "express";
import { Logger } from "../common/logger.js";
import getConfig from "./server-lib-config.js";

export const expressApp = Express();
export let expressAppListener;

let startupTime = Date.now();

/**
 * @param {Logger} logger for messages
 * @param {boolean} devMode to enable de
 */
export async function guiPrepare(logger, devMode) {
  if (devMode) {
    // simulate delay response
    // Thanks to https://stackoverflow.com/a/46976128/1954789
    expressApp.use((req, res, next) => {
      // We delay only if not initial startup
      if (Date.now() - startupTime < 10000) {
        next();
      } else {
        // Wait 2 second at any request
        setTimeout(() => next(), 2000);
      }
    });
  }

  // to support JSON-encoded bodies
  expressApp.use(
    Express.json({
      strict: false
    })
  );

  getConfig("server.expose", []).forEach((element) => {
    logger.debug(`Exposing ${element}}`);
    expressApp.use(element, Express.static(element));
  });
  expressApp.use("/client/", Express.static("built"));
  expressApp.get("/etc/kiosk.yml", (req, res) => res.json(getConfig()));
  expressApp.use(Express.static("."));
}

/**
 * @param {Logger} _logger to log debug
 * @param {boolean} _devMode to enable de
 * @param {string} _url to be loaded
 */
export async function guiLaunch(_logger, _devMode, _url) {
  expressApp.get("/", (req, res) => res.redirect(_url));
  const port = getConfig("core.port", 5454);

  await new Promise((resolve) => {
    expressAppListener = expressApp.listen(port, function () {
      // Thanks to https://stackoverflow.com/a/29075664/1954789
      _logger.info(
        `Listening on port ${this.address().port} (link: 'http://localhost:${
          this.address().port
        }')!`
      );
      resolve(port);
    });
  });
}
