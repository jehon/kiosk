import serverAppFactory from "../../server/server-app.js";

import fs from "fs";
import path from "path";
import chokidar from "chokidar";

/**
 * @typedef ImageData
 * @param {string} subPath relative to the folderConfig home
 * @param {string} path is subPath concatenated with folderConfig path
 * @param {FolderConfig} folderConfig where the file has been defined
 * @param {string} data.title from exiv
 * @param {string} data.date from exiv
 * @param {number} data.orientation from exiv
 *
 * {
 *   subPath: 'f1/i1.png',
 *   path: 'tests/server/data/photo-frame/f1/i1.png',
 *   data: {
 *	   title: 'Test title here',
 *	   date: '2019-07-01 02:03:04',
 *	   orientation: 0
 * }
 */

/**
 * @type {module:server/ServerApp}
 */
const app = serverAppFactory("photo-frame");

export default app;
export const INDEX_FILENAME = "index.json";

/**
 *
 * index.json: generated by file-selector:
 *
 * - originalFilePath: where the file was
 * - subPath: where the file actually is
 * - title
 * - date
 * - orientation
 *
 */

/**
 *
 * @param {string} indexFile to be loaded
 */
export async function loadList(indexFile) {
  let listing = [];
  try {
    const txt = fs.readFileSync(indexFile);
    listing = JSON.parse(txt).map((v) => ({
      ...v,
      url: v.subPath
    }));
  } catch (e) {
    app.error(`Could not load from ${indexFile}`);
    // ok
  }
  app.setState({
    hasList: listing.length > 0,
    listing
  });

  return listing;
}

let watcher = chokidar
  .watch([], {
    persistent: false
  })
  // .on('all', (event, f, stat) => {
  // 	console.log({ e: 'all', event, f, stat });
  // })
  .on("change", (f, _stat) => {
    app.debug(`refreshing: ${f} modified`);
    loadList(f);
  })
  .on("add", (f, _stat) => {
    app.debug(`refreshing: ${f} added`);
    loadList(f);
  });

/**
 * Initialize the package
 *
 * @returns {module:server/ServerApp} the app
 */
export function init() {
  app.setState({
    hasList: false,
    listing: []
  });

  // In unit test, we don't have a config...
  if (app.getConfig(".folder")) {
    const f = path.join(app.getConfig(".folder"), INDEX_FILENAME);
    app.debug(`Loading ${f}`);
    loadList(f);
    watcher.unwatch("*");
    watcher.add(f);
  }

  return app;
}

init();
