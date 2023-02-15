import Express from "express";
import getConfig from "../common/command-line-config.js";

export const expressApp = Express();
export let expressAppListener;

/**
 *
 */
export async function start() {
  const url = "client/index.html";
  // const url = `http://localhost:${app.getConfig('.webserver.port')}/client/index.html`;

  // to support JSON-encoded bodies
  expressApp.use(
    Express.json({
      strict: false
    })
  );

  getConfig("server.expose", []).forEach((element) => {
    expressApp.use(element, Express.static(element));
  });
  expressApp.use("/client/", Express.static("built"));
  expressApp.get("/etc/kiosk.yml", (req, res) => res.json(getConfig()));
  expressApp.use(Express.static("."));

  expressApp.get("/", (req, res) => res.redirect(url));
  const port = getConfig("core.port", 5454);

  await new Promise((resolve) => {
    expressAppListener = expressApp.listen(port, function () {
      // Thanks to https://stackoverflow.com/a/29075664/1954789
      console.info(
        `Listening on port ${this.address().port} (link: 'http://localhost:${
          this.address().port
        }')!`
      );
      resolve(port);
    });
  });
}
