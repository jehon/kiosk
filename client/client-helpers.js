
// clock-client
export async function onDate(date) {
	return new Promise((resolve, _reject) => {
		if (typeof(onDate) == 'string') {
			date = new Date(date);
		}
		const now = new Date();
		if (date < now) {
			return resolve();
		}
		setTimeout(() => resolve(), date - now);
	});
}
