import objectPath from "object-path";
import yargs from "yargs";
import path from "path";
import { fileURLToPath } from "url";
import fs from "fs";
import yaml from "js-yaml";
import deepMerge from "deepmerge";

let config = {
  files: ["etc/kiosk.yml"],
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
export function setConfig(path = "", val = {}) {
  if (path == "") {
    config = val;
    return;
  }
  objectPath.set(config, path, val);
}

// istanbul-ignore-next
/**
 * @returns {Promise<object>} the parsed options
 */
async function loadConfigFromCommandLine() {
  let myargs = yargs(process.argv.slice(2))
    .options({
      file: {
        alias: "f",
        type: "string",
        describe: "additionnal file configuration"
      }
    })
    .help()
    .recommendCommands();

  //
  // Caution: we can not enable "strict()" mode
  //          as webdriverIO add lots of command line parameters
  //          and those command-line parameters would otherwise be rejected
  //          by a strict() mode.
  //
  // myargs = myargs.strict();
  //

  const cmdLineOptions = await myargs.argv;

  if (cmdLineOptions.file) {
    config.files.unshift(cmdLineOptions.file);
  }

  return cmdLineOptions;
}

/**
 * @param {Array<string>} configFiles in order, first one found will be loaded
 * @returns {Promise<object>} the current config
 */
export async function loadConfigFromFile(configFiles = config.files) {
  if (typeof jasmine != "undefined") {
    console.info("Test mode: loading only tests/kiosk.yml");
    configFiles.length = 0;
    configFiles[0] = "tests/kiosk.yml";
  }

  //
  // Setup some general configs
  //

  for (const i in configFiles) {
    const f = configFiles[i];
    if (!f) {
      // skip null etc...
      continue;
    }
    try {
      let txt = fs.readFileSync(f, "utf8");
      if (txt) {
        const doc = yaml.load(txt);
        config = deepMerge(config, doc);
        break;
      }
      console.error("Skipping empty config file " + f);
    } catch (e) {
      if (e && e.code == "ENOENT") {
        console.error("Config file not found " + f);
        continue;
      }
      console.error("Could not load " + f, e);
    }
  }
  return config;
}

/**
 * Load all stuff from command line and default
 *
 * @returns {object} the config loaded
 */
export async function initFromCommandLine() {
  return loadConfigFromCommandLine().then((cmdConfig) =>
    loadConfigFromFile([cmdConfig.file, "etc/kiosk.yml"])
  );
}
