// This is the quit command for the game.  It can be run for one
module.exports = mush => {
  mush.cmds.set("quit", {
    pattern: /^quit\s/i,
    run: socket => {
      mush.flags.set(mush.db.id(socket.id), "!connected");
      mush.db.save();
      // Cycle through the connected sockets and search
      // for one with a matching ID.  Delete them from the
      // connection list and disconnect.
      mush.sockets.forEach(entry => {
        if (socket.id === entry.id) {
          mush.sockets.delete(socket);
        }
      });
      socket.write("*** UrsaMux Disconnecting ***\r\n");
      socket.end();
    }
  });
};
