

import { createClientView, onClient } from './server-lib-gui.js';
import { WEBVIEW_SUB_CHANNEL } from '../common/constants.js';

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

    const channel = app.name + WEBVIEW_SUB_CHANNEL;

    let webContent = null;
    let lastActive = null;

    if (url.substring(0, 4) != 'http') {
        app.error(`No valid url, could not hookWebview: ${url}`);
        return;
    }

    onClient(channel, (status => {
        if (status.active === lastActive) {
            return;
        }
        lastActive = status.active;
        if (status.active) {
            if (!webContent) {
                app.debug('Launching webView to ', url);
                createClientView(url)
                    .then(wc => {
                        webContent = wc;
                        wc.executeJavaScript(`${script}`);
                    });
            }

        } else {
            if (webContent) {
                app.debug('Stopping webview');
                webContent.destroy();
                webContent = null;
            }
        }
    }));

    return app;
}
