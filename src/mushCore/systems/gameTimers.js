module.exports = mush => {
  // Tick
  setInterval(() => {
    if (mush.queues.pQueue.length > 0) {
      const { socket, data, scope = mush.scope } = mush.queues.pQueue[0];
      mush.handle(socket, data, scope);
      mush.queues.pQueue.shift();
    }
  }, 15);

  // Registration reminding timer.
  setInterval(async () => {
    mush.queues.sockets.forEach(async v => {
      if (mush.flags.hasFlags(await mush.db.key(v._key), "!registered")) {
        mush.broadcast.send(
          v,
          "Your character isn't registered. " +
            "Please take a moment to register!%rSee '%ch+help @account%cn'" +
            " For more information."
        );
      }
    });
  }, 1800000);
};
