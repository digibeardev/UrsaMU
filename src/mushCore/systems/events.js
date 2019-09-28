module.exports = mush => {
  // Check for server events!
  mush.emitter.on("move", ({ socket }) => {
    mush.exe(socket, "look", []);
  });

  mush.emitter.on("connected", async socket => {
    try {
      const enactor = await mush.db.key(socket._key);
      const curRoom = await mush.db.key(enactor.location);
      mush.flags.set(enactor, "connected");
      mush.broadcast.sendList(
        socket,
        curRoom.contents,
        `${enactor.name} has connected.`,
        "connected"
      );
    } catch (error) {
      mush.log.error(error);
    }
  });

  mush.emitter.on("close", async error => {
    if (error) {
      for (const sock of mush.queues.sockets) {
        if (!sock._socket.writable) {
          const target = await mush.db.key(sock._key);
          mush.flags.set(target, "!connected");
          mush.queues.sockets.delete(sock);
        }
      }
    }
  });

  mush.emitter.on("disconnected", async socket => {
    const enactor = await mush.db.key(socket._key);
    mush.flags.set(enactor, "!connected");
    const curRoom = await mush.db.key(enactor.location);
    mush.broadcast.sendList(
      socket,
      curRoom.contents,
      `${enactor.name} has disconnected.`,
      "connected"
    );
  });

  mush.emitter.on("channel", (chan, msg) => {
    mush.queues.sockets.forEach(async socket => {
      const target = await mush.db.key(socket._key);

      // loop through each channel, and see if there's a match.
      for (const channel of target.channels) {
        if (channel.name == chan.name && channel.status) {
          let header = "";
          header += chan.header
            ? chan.header
            : `%ch<${capstring(chan.name, "title")}>%cn`;

          try {
            msg = mush.parser.run(msg);
            mush.broadcast.send(socket, `${header} ${channel.title}${msg}`, {
              parse: false
            });
          } catch (error) {
            log.error(error);
          }
        }
      }
    });
  });
};
