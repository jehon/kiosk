import { start } from "./server-lib-gui.js";
import serverAppFactory from "./server-app.js";
import { initFromCommandLine } from "./server-lib-config.js";

const app = serverAppFactory("core");

initFromCommandLine(app)
  .then(() => start(app))
  .then(() => app.info("GUI is started"));
