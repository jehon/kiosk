import {
  selectApplication,
  getApplicationList,
  autoSelectApplication
} from "../client-lib-chooser.js";
import { ClientApp, iFrameBuilder } from "../client-app.js";
import ClientElement from "../client-element.js";
import { humanActiveStatus } from "./human.js";

const app = new ClientApp("menu", {
  applicationsList: []
});

class KioskMenuMainElement extends ClientElement {
  #top;

  /** @override */
  ready() {
    super.ready();

    this.shadowRoot.innerHTML = `
			<jehon-css-inherit></jehon-css-inherit>
			<style>
				#top {
					width: 100%;
					height: 100%;
					margin: 0px;
					border: none;
					padding: 20px;

					box-sizing: border-box;

					display: grid;

					align-items: stretch;
					justify-items: stretch;
				
					grid-template-columns: repeat(5, calc(20% - 20px));
					grid-auto-rows: 200px;
				
					grid-gap: 20px;

					background-color: black;
				}
			</style>
			<div id='top'></div>
		`;

    this.#top = this.shadowRoot.querySelector("#top");
    this.stateChanged();
  }

  /** @override */
  stateChanged() {
    /** @type {Array<ClientApp>} */
    const list = getApplicationList();

    this.#top.innerHTML = "";

    for (const a of list.filter(
      (/** @type {ClientApp} */ a) => a.menuElement && a.mainElementBuilder
    )) {
      a.menuElement.setAttribute("data-app", a.name);
      this.#top.appendChild(a.menuElement);
    }
  }
}
customElements.define("kiosk-menu-main-element", KioskMenuMainElement);

/**
 * Initialization
 */

const appMenuElement = document.querySelector("body > div#app-menu");
if (appMenuElement == null) {
  throw "registerAppMenu: #app-menu is null";
}

appMenuElement.addEventListener("click", () => {
  // Go to menu list application
  selectApplication(app);
});

for (const a of app.getConfig(".")) {
  app.debug(`Registering app by menu: ${a.name}`, a);
  const ap = new ClientApp(a.name)
    .setMainElementBuilder(() => iFrameBuilder(a.url))
    .menuBasedOnIcon(a.icon, a.label);
  if ("priority" in a) {
    ap.setPriority(a.priority);
  }
}

app.setMainElementBuilder(() => new KioskMenuMainElement());

humanActiveStatus.onChange((active) => {
  document.querySelectorAll("#app-menu").forEach((el) => {
    if (active) {
      el.removeAttribute("inactive");
    } else {
      el.setAttribute("inactive", "inactive");
    }
  });
  if (!active) {
    // Trigger a new calculation of the top app
    app.debug("Back to auto select application");
    autoSelectApplication();
  }
});
