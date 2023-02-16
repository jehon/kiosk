import { waitForConfig } from "./client-app.js";
import { autoSelectApplication } from "./client-lib-chooser.js";

//
// Load other packages
//
Promise.all([waitForConfig]).then(() =>
  Promise.all([
    import("./packages/menu-client.js"),
    import("./packages/human-client.js"),
    import("./packages/camera-client.js"),
    import("./packages/clock-client.js"),
    import("./packages/fire-client.js"),
    import("./packages/music-client.js"),
    import("./packages/photo-frame-client.js")
  ]).then(() => {
    autoSelectApplication();
  })
);
