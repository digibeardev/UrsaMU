module.exports = mush => {
  setInterval(() => {
    if (mush.queues.pQueue.length > 0) {
      const { socket, data } = mush.queues.pQueue[0];
      mush.exec(socket, data, mush.scope);
      mush.queues.pQueue.pop();
    }
  }, 10);
};
