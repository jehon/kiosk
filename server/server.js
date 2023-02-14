import { start } from "./server-lib-gui.js";
import serverAppFactory from "./server-app.js";
import { getEnabledDebug, initFromCommandLine } from "./server-lib-config.js";

const app = serverAppFactory("core");

// // Enable this one for early debug:
// enableDebugFor('kiosk:loggers');

initFromCommandLine(app)
  .then(() => {
    app.setState({
      devMode: app.getConfig("server.devMode", false),
      enabledDebug: getEnabledDebug()
    });
  })
  .then(() => {
    return Promise.all([
      import("../packages/camera/camera-server.mjs"),
      import("../packages/photo-frame/photo-frame-server.mjs")
    ]).then(() => {});
  })
  .then(() => start(app))
  .then(() => app.info("GUI is started"));
