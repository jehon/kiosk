import Express from "express";
import getConfig from "../common/command-line-config.js";

export const expressApp = Express();

const url = "client/index.html";

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

expressApp.listen(port, function () {
  // Thanks to https://stackoverflow.com/a/29075664/1954789
  const finalPort = this.address().port;
  console.info(
    `Listening on port ${finalPort} (link: 'http://localhost:${finalPort}')!`
  );
});
