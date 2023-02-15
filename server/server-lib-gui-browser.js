import Express from "express";
import { Logger } from "../common/logger.js";
import getConfig from "./server-lib-config.js";

export const expressApp = Express();
export let expressAppListener;

/**
 * @param {Logger} logger for messages
 */
export async function guiPrepare(logger) {
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
 * @param {Logger} logger to log debug
 * @param {string} url to be loaded
 */
export async function guiLaunch(logger, url) {
  expressApp.get("/", (req, res) => res.redirect(url));
  const port = getConfig("core.port", 5454);

  await new Promise((resolve) => {
    expressAppListener = expressApp.listen(port, function () {
      // Thanks to https://stackoverflow.com/a/29075664/1954789
      logger.info(
        `Listening on port ${this.address().port} (link: 'http://localhost:${
          this.address().port
        }')!`
      );
      resolve(port);
    });
  });
}
