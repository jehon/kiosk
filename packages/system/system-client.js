
import { ClientApp, iFrameBuilder } from '../../client/client-app.js';

const app = new ClientApp('system');

app
  .setMainElementBuilder(() => iFrameBuilder('http://localhost:53466/cgi-bin/check'))
  .menuBasedOnIcon('../packages/system/system.svg');

export default app;
