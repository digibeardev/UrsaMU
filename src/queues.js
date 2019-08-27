class Queue {
  constructor() {
    this.pQueue = [];
    this.oQueue = [];
    this.sockets = new Set();
  }

  idToSocket(id) {
    for (const socket of this.sockets) {
      if (socket.id === id) {
        return socket;
      }
    }
  }
}
module.exports = new Queue();
