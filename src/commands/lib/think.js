module.exports = mush => {
  mush.cmds.set("think", {
    pattern: /^think\s+(.*)/i,
    restriction: "connected",
    run: (socket, match, scope) => {
      try {
        mush.broadcast.send(socket, mush.parser.run(match[1], scope));
      } catch (error) {
        mush.broadcast.send(socket, match[1]);
      }
    }
  });
};
