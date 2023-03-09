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
humanActiveStatus.onChange((isActive) => {
  if (isActive) {
    body.style.cursor = "";
  } else {
    body.style.cursor = "none";
  }
});

// Initialize to false
humanActiveStatus.emit(false);

let eraser = null;

/**
 * @type {object} to remember mouse position
 * @property {number} x where it happened
 * @property {number} y where it happened
 * @property {Date} time when it happened
 */
const lastPosition = {
  x: 0,
  y: 0,
  time: new Date()
};

body.addEventListener("mousemove", (e) => resetHuman(e));

/**
 *
 * @param {MouseEvent} e as mouse event
 */
export function resetHuman(e = new MouseEvent()) {
  const now = new Date();
  if (now.getTime() - lastPosition.time.getTime() > 1000) {
    // Last position is too old, let's start again
    lastPosition.x = e.clientX;
    lastPosition.y = e.clientY;
    lastPosition.time = new Date();
  }

  const dist2 =
    Math.pow(e.clientX - lastPosition.x, 2) +
    Math.pow(e.clientY - lastPosition.y, 2);

  // A big movement in a short time, it's an activity
  if (dist2 > Math.pow(50, 2)) {
    humanActiveStatus.emit(true);

    // Reprogram the 'down' activity
    clearTimeout(eraser);
    eraser = setTimeout(() => {
      clearTimeout(eraser);
      eraser = false;
      humanActiveStatus.emit(false);
    }, app.getConfig(".inactivitySeconds", 60) * 1000);
  }
}
