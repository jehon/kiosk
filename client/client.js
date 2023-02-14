import { ClientApp, waitForConfig } from "./client-app.js";
import { autoSelectApplication } from "./client-lib-chooser.js";

/*
 * Catch all errors and send them to the backend
 */
const globalCatcher = new ClientApp("catch");
window.addEventListener("error", (event) => {
  globalCatcher.error(
    event.message,
    event.filename
      ? event.filename + "#" + event.lineno + ":" + event.colno
      : "",
    event.error
  );
});

//
// Load other packages
//
Promise.all([waitForConfig]).then(() =>
  Promise.all([
    import("../packages/menu/menu-client.js"),
    import("../packages/human/human-client.js"),

    import("../packages/camera/camera-client.js"),
    import("../packages/clock/clock-client.js"),
    import("../packages/fire/fire-client.js"),
    import("../packages/music/music-client.js"),
    import("../packages/photo-frame/photo-frame-client.js")
  ]).then(() => {
    autoSelectApplication();
  })
);
