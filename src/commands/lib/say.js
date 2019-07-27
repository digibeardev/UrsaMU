module.exports = mush => {
  mush.cmds.set("say", {
    pattern: /^(?:"|say\s+)(.*)/i,
    restricted: "connected",
    run: (socket, match, scope) => {
      try {
        mush.broadcast.send(
          socket,
          `You say, "` + mush.parser.run(match[1], scope) + `"`
        );
      } catch (error) {
        mush.broadcast.send(socket, `You say, "` + match[1] + `"`);
      }
    }
  });
};
