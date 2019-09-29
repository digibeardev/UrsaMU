module.exports = mush => {
  mush.cmds.set("@emit", {
    pattern: /^@?emit\s+(.*)/i,
    restriction: "connected",
    run: async (socket, data) => {
      const enactor = await mush.db.key(socket._key);
      const curRoom = await mush.db.key(enactor.location);
      const message = mush.parser.run(socket._key, data[1], mush.scope);
      mush.broadcast.send(socket, message);
      mush.broadcast.sendList(socket, curRoom.contents, message, "connected");
    }
  });
};
