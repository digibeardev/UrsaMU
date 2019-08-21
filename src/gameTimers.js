module.exports = mush => {
  // Tick
  setInterval(() => {
    if (mush.queues.pQueue.length > 0) {
      const { socket, data } = mush.queues.pQueue[0];
      mush.exec(socket, data, mush.scope);
      mush.queues.pQueue.pop();
    }
  }, 10);

  // Registration reminding timer.
  setInterval(() => {
    for (const socket of mush.queues.sockets) {
      if (hasFlag(mush.db.id(socket), "!registered")) {
        mush.broadcast.send(
          socket,
          "Your character isn't registered. " +
            "Please take a moment to register!  See '%ch+help @accounts%cn' For more information."
        );
      }
    }
  }, 300000);
};
