module.exports = mush => {
  setInterval(() => {
    if (mush.pQueue.length > 0) {
      const { socket, data } = mush.pQueue[0];
      mush.exec(socket, data, mush.scope);
      mush.pQueue.pop();
    }
  }, 10);
};
