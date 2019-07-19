module.exports = mush => {
  mush.parser.cmds.set("think", {
    pattern: /^think\s+(.*)/i,
    run: (socket, match, scope) => {
      mush.broadcast.send(socket, mush.parser.run(match[1], scope));
    }
  });
};
