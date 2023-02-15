import objectPath from "object-path";
import yargs from "yargs";
import path from "path";
import { fileURLToPath } from "url";
import fs from "fs";
import yaml from "js-yaml";
import deepMerge from "deepmerge";

let config = {
  file: "etc/kiosk.yml",
  server: {
    root: path.dirname(fileURLToPath(import.meta.url))
  }
};

/**
 * @param {string} path to be found
 * @param {*} def - a default value if config is not set
 * @returns {*} the required object
 */
export default function getConfig(path = "", def = undefined) {
  if (path) {
    if (objectPath.has(config, path)) {
      const val = objectPath.get(config, path);
      return val;
    }
    return def;
  }
  return JSON.parse(JSON.stringify(config));
}

/**
 * @param {string} path where to set
 * @param {*} val to be set
 */
export function _setConfig(path = "", val = {}) {
  if (path == "") {
    config = val;
    return;
  }
  objectPath.set(config, path, val);
}

/**
 * Load all stuff from command line and default
 *
 * @returns {object} the config loaded
 */
export async function initFromCommandLine() {
  const cmdLineOptions = yargs(process.argv.slice(2))
    .options({
      file: {
        alias: "f",
        type: "string",
        describe: "additionnal file configuration",
        default: "etc/kiosk.yml"
      }
    })
    .help()
    .recommendCommands().argv;

  //
  // Caution: we can not enable "strict()" mode
  //          as webdriverIO add lots of command line parameters
  //          and those command-line parameters would otherwise be rejected
  //          by a strict() mode.
  //
  // myargs = myargs.strict();
  //

  if (cmdLineOptions.file) {
    config.file = cmdLineOptions.file;
  }

  if (typeof jasmine != "undefined") {
    console.info("Test mode: loading only tests/kiosk.yml");
    config.file = "tests/kiosk.yml";
  }

  //
  // Setup some general configs
  //

  try {
    let txt = fs.readFileSync(config.file, "utf8");
    if (!txt) {
      console.error("Empty config file " + config.file);
    }
    const doc = yaml.load(txt);
    config = deepMerge(config, doc);
  } catch (e) {
    if (e && e.code == "ENOENT") {
      console.error("Config file not found " + config.file);
    } else {
      console.error("Could not load " + config.file, e);
    }
  }

  return config;
}

await initFromCommandLine();
