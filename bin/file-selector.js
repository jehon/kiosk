#!/usr/bin/env node

// Shellbang:
//   #!/usr/bin/env -S node --experimental-loader 'data:text/javascript,let%20t%3D!0%3Bexport%20async%20function%20resolve(e%2Co%2Cn)%7Bconst%20r%3Dawait%20n(e%2Co)%3Breturn%20t%26%26(r.format%3D%22module%22%2Ct%3D!1)%2Cr%7D'
//
// 	Thanks to https://github.com/nodejs/node/issues/34049#issuecomment-1101720017

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
import yargs from 'yargs';

const indexFilename = 'index.json';


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
 * Find "n" files in the folders and build up a list
 * It will recurse to subfolders (up and down) until "n" files are found
 *
 * @param {string} pathname path
 * @param {FolderConfig} folderConfig where to search for
 * @param {number} n of files to take (will be updated with really taken count)
 * @param {Array<string>} previouslySelected is the list of previously visited folder
 * @returns {Array<string>} is a list of files relative to folder
 */
async function generateListingForPath(pathname, folderConfig, n = folderConfig.quantity, previouslySelected = []) {
  // An array of strings:
  const folders = getWeightedFoldersFromPath(pathname, folderConfig.excludes);

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
        await getFilesFromPathByMime(
          pathname,
          folderConfig.excludes,
          folderConfig.mimeTypePattern
        )
      );

      listing.push(
        ...images
          .slice(0, Math.min(n,
            images.length,
            n - listing.length))
          .map(filename => path.join(pathname, filename))
      );
      continue;
    } else {

      // Take folders
      listing.push(...(await generateListingForPath(
        path.join(pathname, f),
        folderConfig,
        n - listing.length,
        previouslySelected
      )));
    }
  }
  return listing;
}

await yargs(process.argv.slice(2)).options({
  'to': {
    type: 'string',
    default: '.'
  },
  'quantity': {
    type: 'number'
  }
})
  .command(
    'select',
    'Generate a listing',
    {
      'from': {
        type: 'string',
        required: true
      },
      'excludes': {
        type: 'array',
        default: []
      }
    },
    async (options) => {
      options = {
        mimeTypePattern: ['image/*'],
        quantity: 20,
        ...options
      };

      try {
        fs.statSync(options.from);
        fs.statSync(options.to);

        const list = await generateListingForPath(options.from, options);

        if (list.length < 1) {
          warning(`No files found in ${options.from}`);
          process.exit(1);
        }

        info(`Cleaning ${options.to}`);
        fsExtra.emptyDirSync(options.to);

        const infos = [];
        for (const k in list) {
          const k0 = String(k).padStart(2, '0');
          const f = list[k];
          info(`${k}/${options.quantity} Copying ${f}`);
          const targetFn = `${k0}${path.extname(f)}`;
          const targetPath = path.join(options.to, targetFn);
          fs.copyFileSync(f, targetPath);
          const kinfo = {
            originalFilePath: f,
            subPath: targetFn
          };

          try {
            const exifInfo = await exifParser(targetPath);
            kinfo.data = exifInfo;
          } catch (e) {
            warning(`Could not parse exif data for ${targetPath}`);
          }
          infos.push(kinfo);
        }

        fs.writeFileSync(path.join(options.to, indexFilename), JSON.stringify(infos));
      } catch (e) {
        console.error(e);
      }
    }
  )
  .command(
    'concat [folders...]',
    'Concat all separated files',
    {
      folders: {
        type: 'array',
        default: []
      }
    },
    async (options) => {
      const agglomerated = [];
      for (const folder of options.folders) {
        const ifile = path.join(folder, indexFilename);
        try {
          const fdata = JSON.parse(fs.readFileSync(ifile));
          agglomerated.push(
            ...fdata.map(f => ({
              ...f,
              subPath: path.join(folder, f.subPath)
            }))
          );
        } catch (e) {
          warning(`No index.json found at ${ifile}: ${e}`);
        }
      }

      if (options.quantity) {
        agglomerated.splice(options.quantity, agglomerated.length);
      }
      agglomerated.sort((a, b) => ((a.date == b.date) ? 0 : ((a.date > b.date) ? 1 : -1)));
      fs.writeFileSync(path.join(options.to, indexFilename), JSON.stringify(agglomerated, null, 2));
    }
  )
  .recommendCommands()
  .argv;
