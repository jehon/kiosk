#!/usr/bin/env node

import Express from "express";
import getConfig from "./lib/command-line-config.js";

export const expressApp = Express();

// to support JSON-encoded bodies
expressApp.use(
  Express.json({
    strict: false
  })
);

expressApp.use("/client/", Express.static("built"));
expressApp.get("/etc/kiosk.yml", (req, res) => res.json(getConfig()));
expressApp.use(Express.static("."));

expressApp.get("/", (req, res) => res.redirect("client/index.html"));

expressApp.listen(getConfig("core.port", 5454), function () {
  // Thanks to https://stackoverflow.com/a/29075664/1954789
  const finalPort = this.address().port;
  console.info(`Listening on 'http://localhost:${finalPort}'!`);
});
