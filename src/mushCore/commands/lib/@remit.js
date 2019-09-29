module.exports = mush => {
  mush.cmds.set("@remit", {
    pattern: /^@?remit\s+(.*)\s?=\s?(.*)/i,
    restriction: "connected",
    run: async (socket, data) => {
      const room = await mush.db.key(data[1]);
      const message = mush.parser.run(socket._key, data[2], mush.scope);
      if (room) {
        mush.broadcast.send(
          socket,
          `You broadcast to '%ch${room.contents}%cn', ${message}`
        );
        mush.broadcast.sendList(socket, room.contents, message, "connected");
      } else {
        mush.broadcast.send(socket, "I can't find that room.");
      }
    }
  });
};
