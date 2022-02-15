
import { ACTIVITY_SUB_CHANNEL } from '../../common/constants.js';
import serverAppFactory from '../../server/server-app.js';
import { onClient } from '../../server/server-lib-gui.js';
import os from 'os';

/**
 * @type {module:server/ServerApp}
 */
const app = serverAppFactory('system');
export default app;

/**
 * Get the list of all the ips
 *
 * @returns {Array<string>} as external ip's
 */
function getNetworkIP() {
    const nets = os.networkInterfaces();
    const ips = [];
    for (const name of Object.keys(nets)) {
        for (const net of nets[name]) {
            if (!net.internal) {
                ips.push(net.address);
            }
        }
    }
    return ips;
}

/**
 * Initialize the package
 *
 * @returns {module:server/ServerApp} the app
 */
export async function init() {
    const channel = app.name + ACTIVITY_SUB_CHANNEL;

    app.setState({
        initial: true
    });

    onClient(channel, (status) => {

        os;
        if (status.active) {
            app.setState({
                time: new Date(),
                ips: getNetworkIP(),
            });
        }
    });


    return app;
}

init();
