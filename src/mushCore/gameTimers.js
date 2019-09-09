module.exports = mush => {
  // Tick
  setInterval(() => {
    if (mush.queues.pQueue.length > 0) {
      const { socket, data, scope = mush.scope } = mush.queues.pQueue[0];
      mush.handle(socket, data, scope);
      mush.queues.pQueue.pop();
    }
  }, 10);

  // Registration reminding timer.
  setInterval(async () => {
    for (const socket of mush.queues.sockets) {
      if (mush.flags.hasFlags(await mush.db.key(socket._key), "!registered")) {
        mush.broadcast.send(
          socket,
          "Your character isn't registered. " +
            "Please take a moment to register!%r See '%ch+help @accounts%cn'" +
            " For more information."
        );
      }
    }
  }, 1800000);
};
