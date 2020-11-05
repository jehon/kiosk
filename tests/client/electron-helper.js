
window.require = function (mod) {
	if (mod == 'electron') {
		return {
			ipcRenderer: {
				on: function () { }
			}
		};
	}
};
