
/**
 * @param {string} subject - shown in debug logs
 * @param {ServerLogger} logger
 * @param {object} config
 * @param {object} data - data to pass
 * @returns {string} the url to be called
 */
export function getUrl(subject, logger, config, data) {
	const cgi = '/cgi-bin/CGIProxy.fcgi?';
	const url = `http://${config.host}:${config.port}${cgi}?usr=${config.username}&pwd=${config.password}&random-no-cache=${(new Date).getTime()}&` + (new URLSearchParams(data).toString());
	logger.debug(`Using url for ${subject}: ${url}`);
	return url;
}
