#!/usr/bin/env node

/**
 *
 * Manage a list of <files> with
 *
 * - originalFilePath: where the file was
 * - subPath: where the file actually is
 * - title
 * - date
 * - orientation
 */

import fs from 'fs';
import path from 'path';
import exifParser from './lib/exif-parser.js';
import { shuffleArray } from '../server/shuffle.js';
import fsExtra from 'fs-extra';
import { getFilesFromPathByMime, getWeightedFoldersFromPath } from './lib/files.js';
import { initFromCommandLine } from '../server/server-lib-config.js';
import serverAppFactory from '../server/server-app.js';

const IndexFilename = 'index.json';

/**
 * @typedef FolderConfig
 * @param {string} name - name of the config
 * @param {string} folder relative or absolute
 * @param {number} quantity of files
 * @param {string} mimeTypePattern to be matched
 * @param {Array<string>} excludes to be excluded (using minimatch)
 *
 *  folder: /media/photo/
 *	quantity: 20
 *	excludes:
 *	  - "#recycle"
 *	  - "0 A trier"
 */

/**
 * @typedef ImageDescription
 * @param {string} originalFilePath - where the file was stored
 * @param {string} subPath - relative to the index.json
 * @param {object} data - from exif
 */

/**
 * @typedef CtxIndex
 * @param {Array<ImageDescription>} list of images
 * @param {string} context as the context name
 */

/**
 * Show an information
 *
 * @param {string} str to be shown
 */
export function info(str) {
  process.stdout.write(`[I] ${str}\n`);
}

/**
 * Show a warning
 *
 * @param {string} str to be shown
 */
export function warning(str) {
  process.stdout.write(`[Warning] ${str}\n`);
}

/**
 *
 * @param {string} context of the config
 * @param {string} varRoot as abstract destination
 * @param {FolderConfig} config to be used
 * @returns {Promise<Array<ImageDescription>>} as the image descriptions, relative to context
 */
async function generateListingForConfig(context, varRoot, config) {
  const excludes = config.excludes ?? [];
  const mimeTypePattern = config.mimeTypePattern ?? ['image/*'];
  const from = config.path;

  const to = path.join(varRoot, context);
  const previouslySelected = [];
  const maxQuantity = config.quantity ?? 20;

  const indexPath = path.join(to, IndexFilename);

  let n = maxQuantity;
  let index = 0;

  /**
   * Add file to list
   *
   * @param {string} filepath of the file to be added
   * @returns {ImageDescription} as the description of the file
   */
  const addFile = async function (filepath) {
    index++;
    const paddedIndex = String(index).padStart(2, '0');
    info(`${paddedIndex}/${maxQuantity} Copying ${filepath}`);

    // Format: 00.ext
    const targetFn = `${paddedIndex}${path.extname(filepath)}`;
    const targetPath = path.join(to, targetFn);

    fs.copyFileSync(filepath, targetPath);
    const fileInfos = {
      originalFilePath: filepath,
      subPath: targetFn
    };

    try {
      const exifInfo = await exifParser(targetPath);
      fileInfos.data = exifInfo;
    } catch (e) {
      warning(`Could not parse exif data for ${targetPath}`);
    }

    return fileInfos;
  };

  /**
   * Find "n" files in the folders and build up a list
   * It will recurse to subfolders (up and down) until "n" files are found
   *
   * @param {string} pathname path
   * @returns {Array<string>} is a list of files relative to folder
   */
  const generateListingForPath = async function (pathname) {
    // An array of strings:
    const folders = await getWeightedFoldersFromPath(pathname, excludes);

    /** @type {ImageDescription} */
    const listing = [];

    while (folders.length > 0 && listing.length < n) {
    // Take the first one (top priority)
      const f = folders.shift();

      if (f == '.') {
        // Special case: we take the pictures in the current folder

        if (previouslySelected.includes(pathname)) {
          // Don't take twice the same folder
          continue;
        }
        previouslySelected.push(pathname);

        /** @type {Array<string>} - list of max(n) filename with correct mimetype */
        const images = shuffleArray(
          await getFilesFromPathByMime(pathname, excludes, mimeTypePattern)
        );

        listing.push(
          ...images
            .slice(0, Math.min(n, images.length, n - listing.length))
            .map(filename => path.join(pathname, filename))
        );
      } else {
        // Take folders

        listing.push(...await generateListingForPath(path.join(pathname, f)));
      }
    }
    return listing;
  };

  try {
    fs.statSync(from);
    fs.mkdirSync(to, { recursive: true });

    const list = await generateListingForPath(from);

    if (list.length < 1) {
      warning(`No files found in ${from}`);
      // Try to load previous json file if exists
      return JSON.parse(fs.readFileSync(indexPath));
    }

    info(`Cleaning ${to}`);
    fsExtra.emptyDirSync(to);

    const infos = [];
    for (const k in list) {
      const f = list[k];
      infos.push(await addFile(f));
    }

    fs.writeFileSync(indexPath, JSON.stringify(infos, null, 2));

    return infos;
  } catch (e) {
    console.error(e);
    return [];
  }
}

/**
 * Merge various indexes from subfolders
 *
 * @param {string} targetIndex where to store the merged index
 * @param {number} quantity to limit the global count
 * @param {Array<Array<CtxIndex>>} indexes list of indexes (list, context)
 * @returns {Array<ImageDescription>} merged
 */
function mergeIndexes(targetIndex, quantity, indexes) {
  const merged = [];
  for (const fdata of indexes) {
    merged.push(
      ...fdata.list.map(f => ({
        ...f,
        subPath: path.join(fdata.context, f.subPath)
      }))
    );
  }

  if (quantity > 0) {
    merged.splice(quantity);
  }
  merged.sort((a, b) => ((a.date == b.date) ? 0 : ((a.date > b.date) ? 1 : -1)));
  fs.writeFileSync(targetIndex, JSON.stringify(merged, null, 2));
  return merged;
}

const app = serverAppFactory('photo-frame');

initFromCommandLine(app)
  .then(async () => {
    const folders = app.getConfig('.sources', {});
    return Promise.all(Object.entries(folders)
      .map(async ([context, fdata]) => ({
        context: context,
        list: await generateListingForConfig(context, 'var/photo-frame', fdata)
      })));
  })
  .then(ctxIndexes => mergeIndexes(
    path.join('var/photo-frame', IndexFilename),
    1,
    ctxIndexes));
