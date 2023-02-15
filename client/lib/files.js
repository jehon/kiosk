import fs from "fs";
import path from "path";
import mime from "mime-types";
import minimatch from "minimatch";
import shuffleWeightedList from "./random.js";

/**
 * Test if a file match the pattern
 * (used to exclude files)
 *
 * @param {string} fileName to be matched
 * @param {string} pattern to match
 * @returns {boolean} true if it match
 */
function matchFile(fileName, pattern) {
  return minimatch(fileName, pattern, {
    nocase: true,
    nocomment: true,
    nonegate: true
  });
}

/**
 * Get all files of a folder
 *
 * @param {string} pathname relative to cwd or absolute
 * @param {Array<string>} excludes to be excluded (by minimatch *.*, ...)
 * @returns {Array<string>} of file paths relative to folder
 */
async function getFilesFromPath(pathname, excludes = []) {
  return fs
    .readdirSync(pathname)
    .filter((file) => !(file in [".", ".."]))
    .filter((file) =>
      excludes.reduce((acc, val) => acc && !matchFile(file, val), true)
    );
}

/**
 * Get files of mimetype in a folder
 *
 * @param {string} pathname relative to cwd or absolute
 * @param {Array<string>} excludes to be excluded (by minimatch *.*, ...)
 * @param {string} mimeTypePattern to filter in (image/*)
 * @returns {Array<string>} of file paths relative to folder
 */
export async function getFilesFromPathByMime(
  pathname,
  excludes,
  mimeTypePattern
) {
  return (await getFilesFromPath(pathname, excludes)).filter((f) => {
    let mt = mime.lookup(path.join(pathname, f));
    if (typeof mt != "string") {
      return false;
    }
    return mt.match(mimeTypePattern);
  });
}

/**
 * Get subfolders out of a folder
 *
 * @param {string} pathname relative to cwd or absolute
 * @param {Array<string>} excludes to be excluded (by minimatch *.*, ...)
 * @returns {Array<string>} of folders (absolute)
 */
export async function getFoldersFromPath(pathname, excludes) {
  return (await getFilesFromPath(pathname, excludes)).filter((f) =>
    fs.statSync(path.join(pathname, f)).isDirectory()
  );
}

/**
 *
 * @param {string} pathname to look in
 * @param {Array<string>} excludes with miniglob
 * @returns {Promise<Object<number>>} a map from "folder names" to "priorities"
 */
export async function getWeightedFoldersFromPath(pathname, excludes) {
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
    ".": 1,
    ...(await getFoldersFromPath(pathname, excludes)).reduce((acc, v) => {
      // Add the priority for the file
      acc[v] = 1;
      try {
        const dfile = pathname.join(pathname, v, "kiosk.json");
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
