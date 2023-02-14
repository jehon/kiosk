import { spawnSync } from "child_process";

//
// Faces:
//  - www.metadataworkinggroup.com/specs/
//  - https://stackoverflow.com/questions/12115998/face-tagging-information-and-photo-metadata
//

/**
 * @param {...any} params of the exiv run
 * @returns {string} the output
 */
function runExiv(params) {
  //
  // Error here ? check exiv is installed :-)
  //
  let processResult = spawnSync("exiftool", params);
  switch (processResult.status) {
    case 0: // ok, continue
      break;
    case 1: // The file contains data of an unknown image type
    case 253: // No exif data found in file
      return "";
    case 255: // File does not exists
      return "";
    default:
      throw new Error(
        "\n\nrunExiv process: " +
          processResult.status +
          " with [ " +
          params.join(" , ") +
          " ] => " +
          (processResult.stderr
            ? processResult.stderr.toString()
            : "no error message")
      );
  }
  if (processResult.stdout != null) {
    return processResult.stdout.toString();
  }
  return "";
}

/**
 * @param {string} filePath of the image
 * @returns {object} the parsed informations
 */
export default async function exivReadAll(filePath) {
  const txtResult = runExiv([
    "-j", // Output as JSON
    "-m", // Ignore minor errors and warnings
    filePath
  ]);
  const data = JSON.parse(txtResult)[0];
  const result = {
    title: data["Title"] ?? "",
    // yyyy:mm:dd hh:mm:ss -> yyyy-mm-dd hh:mm:ss
    date: (data["DateTimeOriginal"] ?? "").replace(":", "-").replace(":", "-"),
    orientation: data["Orientation"] ?? 0
  };
  return result;
}
