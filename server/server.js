import { start } from "./server-lib-gui.js";
import serverAppFactory from "./server-app.js";
import { getEnabledDebug, initFromCommandLine } from "./server-lib-config.js";

const app = serverAppFactory("core");

// // Enable this one for early debug:
// enableDebugFor('kiosk:loggers');

initFromCommandLine(app)
  .then(() => {
    app.setState({
      enabledDebug: getEnabledDebug()
    });
  })
  .then(() => start(app))
  .then(() => app.info("GUI is started"));
