import { guiLaunch, guiPrepare } from "./server-lib-gui-browser.js";

export { expressApp } from "./server-lib-gui-browser.js";

/**
 * @param {module:server/ServerApp} serverApp for logging purpose
 */
export async function start(serverApp) {
  const logger = serverApp.childLogger("gui");

  const url = "client/index.html";
  // const url = `http://localhost:${app.getConfig('.webserver.port')}/client/index.html`;

  await guiPrepare(logger);

  await guiLaunch(logger, url);
}
