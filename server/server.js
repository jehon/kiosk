import { start } from "./server-lib-gui.js";
import serverAppFactory from "./server-app.js";
import { initFromCommandLine } from "../common/command-line-config.js";

const app = serverAppFactory("core");

initFromCommandLine().then(() => start(app));
