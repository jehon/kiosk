import {
  guiDispatchToBrowser,
  guiLaunch,
  guiPrepare
} from "./server-lib-gui-browser.js";

export { expressApp } from "./server-lib-gui-browser.js";

const historySent = new Map();

/**
 * @param {module:server/ServerApp} serverApp for logging purpose
 */
export async function start(serverApp) {
  const logger = serverApp.childLogger("gui");
  const devMode = serverApp.getConfig("server.devMode");
  if (devMode) {
    logger.debug("Enabling dev mode");
  }

  const url = "client/index.html";
  // const url = `http://localhost:${app.getConfig('.webserver.port')}/client/index.html`;

  await guiPrepare(logger, devMode);

  await guiLaunch(logger, devMode, url);
}

/**
 * @param {string} eventName to be sent
 * @param {object} data to be sent
 */
export function dispatchToBrowser(eventName, data) {
  historySent.set(eventName, data);
  guiDispatchToBrowser(eventName, data);
}
