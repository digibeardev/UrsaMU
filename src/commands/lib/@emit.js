module.exports = mush => {
  mush.cmds.set("@emit", {
    pattern: /^@?emit\s+(.*)/i,
    restriction: "connected",
    run: (socket, data) => {
      const enactor = mush.db.id(socket.id);
      const curRoom = mush.db.id(enactor.location);
      const message = mush.parser.run(data[1], mush.scope);
      mush.broadcast.send(socket, message);
      mush.broadcast.sendList(socket, curRoom.contents, message, "connected");
    }
  });
};
