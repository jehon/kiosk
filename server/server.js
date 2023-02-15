import { start } from "./server-lib-gui.js";
import { initFromCommandLine } from "../common/command-line-config.js";

initFromCommandLine().then(() => start());
