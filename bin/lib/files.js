
import fs from 'fs';
import path from 'path';
import mime from 'mime-types';
import minimatch from 'minimatch';
import shuffleWeightedList from './random';

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
export async function getFilesFromFolderByMime(folder, excludes, mimeTypePattern) {
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
export async function getFoldersFromFolder(folder, excludes) {
  return (await getFilesFromFolder(folder, excludes))
    .filter(f => fs.statSync(path.join(folder, f)).isDirectory());
}

/**
 *
 * @param {string} folder to look in
 * @param {Array<string>} excludes with miniglob
 * @returns {Promise<Object<number>>} a map from "folder names" to "priorities"
 */
export async function getWeightedFoldersFromFolder(folder, excludes) {
  //
  // Shuffle will send back an array of strings
  //   each string is the name of a folder (relative to folder)
  //

  // Build un an object:
  //   {
  //       .: priority
  //       folder1: priority
  //       folder2: priority
  //   }
  //
  // And take into account kiosk.yml in each folder => .priority
  //
  const prioritizedFolders = {
    '.': 1,
    ...(await getFoldersFromFolder(folder, excludes))
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

  return shuffleWeightedList(prioritizedFolders);
}