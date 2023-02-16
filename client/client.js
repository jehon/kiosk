import { autoSelectApplication } from "./client-lib-chooser.js";

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
