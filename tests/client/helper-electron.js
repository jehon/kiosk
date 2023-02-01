
window.require = function (mod) {
  if (mod == 'electron') {
    return {
      ipcRenderer: {
        on: function (channel, callback) {
          if (simulateIpcRendererSendMap.has(channel)) {
            throw 'simulateIpcRendererSendMap: has already ' + channel;
          }
          simulateIpcRendererSendMap.set(channel, callback);
        },
        send: (channel, payload) => sentList.push({ channel, payload })
      }
    };
  }
};

/**
 * Reset the test environment
 */
export function reset() {
  simulateIpcRendererSendMap.clear();
  sentList.length = 0;
}

/**
 * The list of stuff to send to
 */
export const sentList = [];

const simulateIpcRendererSendMap = new Map();
/**
 * Simulate the sending of an event from the server
 *
 * @param {string} channel on which to send
 * @param {*} value to be send
 */
export function simulateIpcRendererSend(channel, value) {
  if (simulateIpcRendererSendMap.has(channel)) {
    simulateIpcRendererSendMap.get(channel)(value);
  }
}
