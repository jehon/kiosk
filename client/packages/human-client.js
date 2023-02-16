import { ClientApp } from "../client-app.js";
import Callback from "../callback.js";

const app = new ClientApp("human");
const body = document.querySelector("body");

//
//
// DEBUG
//
//   status is boolean
//
window.addEventListener("contextmenu", (e) => {
  e.preventDefault();
});

//
//
// ACTIVITY
//
//   status is boolean
//

export const humanActiveStatus = new Callback();
humanActiveStatus.onChange((status) => {
  if (status) {
    body.style.cursor = "";
  } else {
    body.style.cursor = "none";
  }
});

humanActiveStatus.onChange((status) => {
  app.debug("Activity: ", status);
});

/**
 * @param {boolean} activity to be set (true if current activity)
 */
function setActivity(activity = true) {
  humanActiveStatus.emit(activity);
}

// Initialize to false
setActivity(false);

let eraser = null;

/**
 * @type {object} to remember mouse position
 * @property {number} x where it happened
 * @property {number} y where it happened
 * @property {Date} time when it happened
 */
const lastPosition = {};
memorizePosition(new MouseEvent(""));

/**
 * @param {MouseEvent} e to be memorized
 */
function memorizePosition(e) {
  lastPosition.x = e.clientX;
  lastPosition.y = e.clientY;
  lastPosition.time = new Date();
}

body.addEventListener("mousemove", (e) => {
  const now = new Date();
  if (now.getTime() - lastPosition.time.getTime() > 1000) {
    // Last position is too old, let's start again
    app.debug("Reset position");
    memorizePosition(e);
  }

  const dist2 =
    Math.pow(e.clientX - lastPosition.x, 2) +
    Math.pow(e.clientY - lastPosition.y, 2);

  // A big movement in a short time, it's an activity
  if (dist2 > Math.pow(50, 2)) {
    setActivity(true);

    // Reprogram the 'down' activity
    clearTimeout(eraser);
    eraser = setTimeout(() => {
      clearTimeout(eraser);
      eraser = false;
      setActivity(false);
    }, ((app.getState()?.server?.config ?? {})["inactivitySeconds"] ?? 60) * 1000);
  }
});
