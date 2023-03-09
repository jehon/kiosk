import { autoSelectApplication } from "./client-lib-chooser.js";
import { loadConfig } from "./app.js";

//
// Top-Level-Await is not working in Karma/Jasmine
//
await loadConfig();

//
// Load other packages
//
await Promise.all([
  import("./packages/menu.js"),
  import("./packages/human.js"),
  import("./packages/clock.js"),
  import("./packages/fire.js"),
  import("./packages/music.js"),
  import("./packages/photo-frame.js")
]);

await autoSelectApplication();
