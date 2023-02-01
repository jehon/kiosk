
import serverAppFactory from '../../server/server-app.js';

/**
 * @typedef {import('../../common/app.js').CronStats} CronStats
 */

/*
Status:
{
	currentTicker: {

	}
	config: {
		cron
		duration
		type
		url
	}
}

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

/**
 * Called when a ticker start
 * Need to program the end of the ticker
 *
 * @param {object} data to be passed to the ticker
 * @param {CronStats} stats of the trigger
 */
function onCron(data, stats) {
  app.debug('Fire cron started:', data);
  app.mergeState({
    currentTicker: data
  });

  app.onDate(stats.end, () => {
    const status = app.getState();
    // Is it the current ticker?
    if (status.currentTicker == data) {
      app.debug('Fire cron ended:', data);
      // We have this event, so let's stop it and become a normal application again...
      app.mergeState({
        currentTicker: null
      });
    } else {
      app.debug('Fire cron override:', data);
    }
  });
}

let disableCron = null;

/**
 * Initialize the package
 *
 * @returns {module:server/ServerApp} the app
 */
export function init() {
  app.debug('Programming fire cron\'s');
  if (disableCron) {
    disableCron();
  }

  disableCron = app.cron({
    onCron,
    cron: app.getConfig('.cron', ''),
    duration: app.getConfig('.duration', 30)
  });

  app.setState(status);

  return app;
}

init();
