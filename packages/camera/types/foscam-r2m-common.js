
/**
 * @param {string} subject - shown in debug logs
 * @param {module:server/ServerLogger} logger to log
 * @param {object} hardware of the hardware
 * @param {object} data - data to pass
 * @returns {string} the url to be called
 */
export function getUrl(subject, logger, hardware, data) {
	const cgi = '/cgi-bin/CGIProxy.fcgi?';
	const url = `http://${hardware.host}:${hardware.port}${cgi}?usr=${hardware.username}&pwd=${hardware.password}&random-no-cache=${(new Date).getTime()}&` + (new URLSearchParams(data).toString());
	// logger.debug(`Using url for ${subject}: ${url}`);
	return url;
}
