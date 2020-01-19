
const serverAPIFactory = require('../../server/server-api.js');
const app = serverAPIFactory('menu');

const appConfigs = app.getConfig('.', []);
app.debug('Detected app configs', appConfigs);
app.dispatchToBrowser('.apps');

module.exports.getAppConfigs = function() {
	return appConfigs;
};
