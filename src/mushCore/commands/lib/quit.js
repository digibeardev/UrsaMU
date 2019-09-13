// This is the quit command for the game.  It can be run for one
module.exports = mush => {
  mush.cmds.set("quit", {
    pattern: /^quit/i,
    run: async socket => {
      await mush.flags.set(await mush.db.key(socket._key), "!connected");
      mush.emitter.emit("disconnected", socket);
      // Cycle through the connected sockets and search
      // for one with a matching ID.  Delete them from the
      // connection list and disconnect.
      mush.queues.sockets.forEach(entry => {
        if (socket._key === entry._key) {
          mush.queues.sockets.delete(socket);
        }
      });

      socket.end("*** UrsaMU Disconnecting ***\r\n");
    }
  });
};
