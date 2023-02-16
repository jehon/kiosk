// /* eslint-ignore */

// import ChildProcess from "child_process";
// import fetch from "node-fetch";

// import { CameraAPI } from "../camera-constants.js";

// const publicUrl = "/camera/video.mp4";

// /**
//  * @param {number} ms - milliseconds to wait before resolving the promise
//  * @returns {Promise<void>} - the promise that will resolve
//  */
// async function waitMilliseconds(ms) {
//   return new Promise((resolve) => setTimeout(resolve, ms));
// }

// /**
//  * @param {string} subject - shown in debug logs
//  * @param {module:server/ServerLogger} logger to log
//  * @param {object} config of the hardware
//  * @param {object} data - data to pass
//  * @returns {string} the url to be called
//  */
// export function getUrl(subject, logger, config, data) {
//   const cgi = "/cgi-bin/CGIProxy.fcgi?";
//   const url =
//     `http://${config.host}:${config.port}${cgi}?usr=${config.username}&pwd=${
//       config.password
//     }&random-no-cache=${new Date().getTime()}&` +
//     new URLSearchParams(data).toString();
//   // logger.debug(`Using url for ${subject}: ${url}`);
//   return url;
// }

// /**
//  * @type {module:packages/camera/CameraAPI}
//  */
// export default class extends CameraAPI {
//   defaultConfig() {
//     return {
//       configure: true,
//       host: "localhost",
//       port: 88,
//       username: "",
//       password: ""
//     };
//   }

//   constructor(...args) {
//     super(...args);

//     expressApp.get(publicUrl, (_req, res) => {
//       this.debug(`received connection for ${publicUrl}`);
//       //
//       // HTML 5: browser support
//       //     https://en.wikipedia.org/wiki/HTML5_video#Browser_support
//       //

//       res.header("content-type", "video/mp4");
//       // const convert = `-c:v copy -an -bsf:v h264_mp4toannexb -maxrate 500k -f matroska`;
//       // -f dash -window_size 4 -extra_window_size 0 -min_seg_duration 2000000 -remove_at_exit 1
//       // const convert = '-an -c:v copy -b:v 2000k -f m4s';
//       // const convert = `-c:v libx264 -f mp4`;

//       //
//       // work only in chrome !
//       // For firefox, see https://support.mozilla.org/en-US/kb/html5-audio-and-video-firefox
//       //
//       // const convert = '-vcodec copy -an -f matroska';

//       // With many helps
//       //    https://github.com/w23/zenki/blob/master/rtsp-to-hls.sh
//       //    https://stackoverflow.com/a/66165298/1954789
//       //
//       // -movflags frag_keyframe+empty_moov: solve framgentation problem
//       //
//       // Works in Firefox and Chrome ?
//       //
//       const convert =
//         "-c:v copy -movflags frag_keyframe+empty_moov -an -r 1 -f ismv";

//       const cmd = `ffmpeg -rtsp_transport tcp -i rtsp://${this.config.username}:${this.config.password}@${this.config.host}:${this.config.port}/videoSub ${convert} -`;
//       this.debug("ffmpeg command: ", cmd);

//       const cmdArray = cmd.split(" ");
//       const ffmpeg = ChildProcess.spawn(cmdArray[0], cmdArray.splice(1), {
//         stdio: ["ignore", "pipe", "ignore"]
//         // stdio: ['ignore', 'pipe', process.stderr]
//       });

//       ffmpeg.stdio[1].pipe(res);

//       res.on("close", () => {
//         this.debug("Http flow ended, killing ffmpeg");
//         ffmpeg.kill();
//       });
//     });
//   }

//   async check() {
//     const url = getUrl("health check", this.app, this.config, {
//       cmd: "getDevInfo"
//     });
//     this.debug("checking ", { url, config: this.config });

//     return fetch(url, { method: "GET" }).then(
//       (response) => {
//         this.debug("Check done", response.statusText);
//         if (!response.ok) {
//           this.app.debug("Check response error", response);
//           throw new Error(response.status + ": " + response.statusText);
//         }
//         this.debug("Check successfull");
//         return true;
//       },
//       (err) => {
//         this.debug("Camera in error", err);
//         throw err;
//       }
//     );
//   }

//   async up() {
//     // For dev environment !
//     if (!this.config.configure) {
//       this.app.info("Skipping configure by config");
//       return;
//     }

//     const now = new Date();
//     await fetch(
//       getUrl("setting time", this.app, this.config, {
//         cmd: "setSystemTime",
//         timeSource: 1,
//         year: now.getFullYear(),
//         mon: now.getMonth() + 1,
//         day: now.getDate(),
//         hour: now.getHours(),
//         minute: now.getMinutes(),
//         sec: now.getSeconds()
//       })
//     );

//     if (this.config.position) {
//       await fetch(
//         getUrl("reset position", this.app, this.config, {
//           cmd: "ptzReset"
//         })
//       );

//       await waitMilliseconds(5000);

//       const move = async (field, command) => {
//         if (this.config.position[field]) {
//           await fetch(
//             getUrl(`moving ${field}`, this.app, this.config, {
//               cmd: command
//             })
//           );

//           await waitMilliseconds(this.config.position[field]);

//           await fetch(
//             getUrl(`stop mouvement ${field}`, this.app, this.config, {
//               cmd: "ptzStopRun"
//             })
//           );
//         }
//       };

//       await move("left", "ptzMoveLeft");
//       await move("right", "ptzMoveRight");
//       await move("up", "ptzMoveUp");
//       await move("down", "ptzMoveDown");
//     }

//     return publicUrl;
//   }
// }
