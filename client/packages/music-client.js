import { ClientApp, iFrameBuilder } from "../client-app.js";
import { priorities } from "../config.js";

const app = new ClientApp("music");

app
  .setMainElementBuilder(() =>
    iFrameBuilder("http://" + location.hostname + ":8800/")
  )
  .menuBasedOnIcon("../packages/music/music-icon.svg")
  .setPriority(priorities.music.normal);

export default app;
