module.exports = mush => {
  mush.cmds.set("think", {
    pattern: /^think\s+(.*)/i,
    restriction: "connected",
    run: async (socket, match) => {
      try {
        mush.broadcast.send(
          socket,
          await mush.parser.run(socket._key, match[1], mush.scope)
        );
      } catch (err) {
        mush.broadcast.send(socket, match[1]);
      }
    }
  });
};
