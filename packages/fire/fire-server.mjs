
import serverAppFactory from '../../server/server-app.js';

/**
 * @typedef {import('../../common/app.js').CronStats} CronStats
 */

/**
 * @type {module:server/ServerApp}
 */
const app = serverAppFactory('fire');

export default app;

const status = {
  currentTicker: null,
  config: app.getConfig()
};

let schedulerStop = null;

/**
 * Initialize the package
 *
 * @returns {module:server/ServerApp} the app
 */
export function init() {
  app.debug('Programming fire cron\'s');
  if (schedulerStop) {
    schedulerStop();
  }

  schedulerStop = app.cron({
    cron: app.getConfig('.cron', ''),
    duration: app.getConfig('.duration', 30),
    onCron: (context, stats) => {
      app.mergeState({
        currentTicker: { context, stats }
      });
    },
    onEnd: () => {
      app.mergeState({
        currentTicker: null
      });
    }
  });

  app.setState(status);

  return app;
}

init();
