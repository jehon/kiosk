
const serverAPIFactory = require('../../server/server-api.js');
const app = serverAPIFactory('menu:server');

const appConfigs = app.getConfig('.', []);
app.debug('Sending app configs to client', appConfigs);
app.dispatchToBrowser('.apps', appConfigs);
