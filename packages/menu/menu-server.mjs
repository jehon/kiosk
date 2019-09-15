
import serverAPIFactory from '../../server/server-api.mjs';
const app = serverAPIFactory('menu:server');

const appConfigs = app.getConfig('.', []);
app.debug('Sending app configs to client', appConfigs);
app.dispatchToBrowser('.apps', appConfigs);
