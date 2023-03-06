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
  import("./packages/menu-client.js"),
  import("./packages/human-client.js"),
  import("./packages/camera-client.js"),
  import("./packages/clock-client.js"),
  import("./packages/fire-client.js"),
  import("./packages/music-client.js"),
  import("./packages/photo-frame-client.js")
]);

await autoSelectApplication();
