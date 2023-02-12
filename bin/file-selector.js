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
import fsExtra from 'fs-extra';
import mime from 'mime-types';
import minimatch from 'minimatch';
import path from 'path';
import yargs from 'yargs';
import exifParser from './lib/exif-parser.js';

const indexFilename = 'index.json';

let verbose = false;

/**
 * Log something only if in verbose mode
 *
 * @param {string} str to write
 */
function log(str) {
  if (verbose) {
    process.stdout.write(`[D] ${str}\n`);
  }
}

/**
 * Show an information
 *
 * @param {string} str to be shown
 */
function info(str) {
  process.stdout.write(`[I] ${str}\n`);
}

/**
 * Show a warning
 *
 * @param {string} str to be shown
 */
function warning(str) {
  process.stdout.write(`[Warning] ${str}\n`);
}

/**
 * @param {object} weightedList with weight
 * @returns {any} taken in random
 */
function takeOne(weightedList) {
  const sum = Object.values(weightedList).reduce((n, i) => n + i, 0);

  if (sum == 0) {
    return Object.keys(weightedList).pop();
  }

  const r = Math.random() * sum;
  // const r = secureRandom(sum);

  let s = 0;
  for (const k of Object.keys(weightedList)) {
    s += weightedList[k];
    if (r < s) {
      return k;
    }
  }

  return Object.keys(weightedList).pop();
}

/**
 * @param {object} weightedList with weight
 * @returns {Array} weighted (top priority first => .shift())
 */
export default function shuffle(weightedList) {
  const keys = Object.keys(weightedList);

  const res = [];
  const N = keys.length;
  for (var i = 0; i < N; i++) {
    const k = takeOne(weightedList);
    delete weightedList[k];
    res.push(k);
  }

  return res;
}

/**
 * @param {Array} arr to be shuffled
 * @returns {Array} not wiehgted
 */
export function shuffleArray(arr) {
  return shuffle(
    arr.reduce((acc, v) => { acc[v] = 1; return acc; }, {})
  );
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
 * Test if a file match the pattern
 * (used to exclude files)
 *
 * @param {string} filename to be matched
 * @param {string} pattern to match
 * @returns {boolean} true if it match
 */
function matchFile(filename, pattern) {
  return minimatch(filename, pattern, {
    nocase: true,
    nocomment: true,
    nonegate: true
  });
}

/**
 * Get all files of a folder
 *
 * @param {string} folder relative to cwd or absolute
 * @param {Array<string>} excludes to be excluded (by minimatch *.*, ...)
 * @returns {Array<string>} of file paths relative to folder
 */
async function getFilesFromFolder(folder, excludes = []) {
  return fs.readdirSync(folder)
    .filter(file => !(file in ['.', '..']))
    .filter(file => excludes.reduce((acc, val) => acc && !matchFile(file, val), true));
}

/**
 * Get files of mimetype in a folder
 *
 * @param {string} folder relative to cwd or absolute
 * @param {Array<string>} excludes to be excluded (by minimatch *.*, ...)
 * @param {string} mimeTypePattern to filter in (image/*)
 * @returns {Array<string>} of file paths relative to folder
 */
async function getFilesFromFolderByMime(folder, excludes, mimeTypePattern) {
  return (await getFilesFromFolder(folder, excludes))
    .filter(f => {
      let mt = mime.lookup(path.join(folder, f));
      if (typeof (mt) != 'string') {
        return false;
      }
      return mt.match(mimeTypePattern);
    });
}

/**
 * Get subfolders out of a folder
 *
 * @param {string} folder relative to cwd or absolute
 * @param {Array<string>} excludes to be excluded (by minimatch *.*, ...)
 * @returns {Array<string>} of folders (absolute)
 */
async function getFoldersFromFolder(folder, excludes) {
  return (await getFilesFromFolder(folder, excludes))
    .filter(f => fs.statSync(path.join(folder, f)).isDirectory());
}

/**
 * Find "n" files in the folders and build up a list
 * It will recurse to subfolders (up and down) until "n" files are found
 *
 * @param {string} folder path
 * @param {FolderConfig} folderConfig where to search for
 * @param {number} n of files to take (will be updated with really taken count)
 * @param {Array<string>} previouslySelected is the list of previously visited folder
 * @returns {Array<string>} is a list of files relative to folder
 */
async function generateListingForPath(folder, folderConfig, n = folderConfig.quantity, previouslySelected = []) {
  log(`Entering ${folder}`);

  //
  // Shuffle will send back an array of strings
  //   each string is the name of a folder (relative to folder)
  //
  const priorityFolders = {
    '.': 1,
    ...(await getFoldersFromFolder(folder, folderConfig.excludes))
      .reduce((acc, v) => {
        // Add the priority for the file
        acc[v] = 1;
        try {
          const dfile = path.join(folder, v, 'kiosk.json');
          if (fs.statSync(dfile)) {
            const content = JSON.parse(fs.readFileSync(dfile));
            if (content && content.priority) {
              acc[v] = content.priority;
            }
          }
        } catch (_e) {
          // expected
        }
        return acc;
      }, {})
  };

  //
  // We need an object here
  // so that we can influence proportions of each times
  //   key: folder name (relative to folder)
  //   value: # of times this folder is taken into account in lottery
  //            (once taken, it is removed)
  //          default = 1
  //
  const folders = shuffle(priorityFolders);

  const listing = [];

  while (folders.length > 0 && listing.length < n) {
    // Take the first one (top priority)
    const f = folders.shift();

    if (f == '.') {
      // Special case: we take the pictures in the current folder
      if (previouslySelected.includes(folder)) {
        // Don't take twice the same folder
        continue;
      }
      previouslySelected.push(folder);

      /** @type {Array<string>} - list of max(n) filename with correct mimetype */
      const images = shuffleArray(
        await getFilesFromFolderByMime(
          folder,
          folderConfig.excludes,
          folderConfig.mimeTypePattern
        )
      );

      listing.push(
        ...images
          .slice(0, Math.min(n,
            images.length,
            n - listing.length))
          .map(filename => path.join(folder, filename))
      );
      continue;
    } else {

      // Take folders
      listing.push(...(await generateListingForPath(
        path.join(folder, f),
        folderConfig,
        n - listing.length,
        previouslySelected
      )));
    }
  }
  return listing;
}

await yargs(process.argv.slice(2)).options({
  'verbose': {
    alias: ['v'],
    type: 'boolean',
    default: false,
    coerce: val => {
      verbose = val;
      return val;
    }
  },
  'dryRun': {
    alias: ['dry-run', 'n'],
    type: 'boolean',
    default: false,
    coerce: (val) => {
      if (val) {
        console.info('Using dry run mode');
      }
      return val;
    }
  },
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
  .strict()
  .help()
  .alias('help', 'h')
  .argv;
