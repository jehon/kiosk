
import serverAPIFactory from '../../server/server-api.mjs';
const serverAPI = serverAPIFactory('menu');

serverAPI.dispatchToBrowser('.apps', serverAPI.getConfig() || []);
