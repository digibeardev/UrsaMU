class Queue {
  constructor() {
    this.pQueue = [];
    this.oQueue = [];
    this.sockets = new Set();
  }

  keyToSocket(key) {
    for (const socket of this.sockets) {
      if (socket._key === key) {
        return socket;
      }
    }
  }
}
module.exports = new Queue();
