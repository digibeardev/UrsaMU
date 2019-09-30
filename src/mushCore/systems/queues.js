class Queue {
  constructor() {
    this.pQueue = [];
    this.oQueue = [];
    this.sockets = new Map();
  }

  keyToSocket(key) {
    return this.sockets.get(key);
  }
}
module.exports = new Queue();
