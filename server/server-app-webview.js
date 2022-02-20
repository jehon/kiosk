

import { createClientView, onClient } from './server-lib-gui.js';

/**
 * Hook WebView loading into an application
 *
 * @param {module:server/ServerApp} app to hook around
 * @param {string} url to be loaded
 * @param {string} script to be injected into app
 * @returns {module:server/ServerApp} the app
 */
export default function hookWebview(app, url, script = '') {
    app.debug('Programming webview backend');

    let webContents = null;
    let lastActive = null;

    if (url.substring(0, 4) != 'http') {
        app.error(`No valid url, could not hookWebview: ${url}`);
        return;
    }

    onClient(app.getChannel(), (status => {
        if (status.active === lastActive) {
            return;
        }
        lastActive = status.active;
        if (status.active) {
            if (!webContents) {
                app.debug('Launching webView to ', url);
                webContents = createClientView(url, script);
            }

        } else {
            if (webContents) {
                app.debug('Stopping webview');
                webContents.iWantToBeDestroyed = true;
                webContents.destroy();
                webContents = null;
            }
        }
    }));

    return app;
}
