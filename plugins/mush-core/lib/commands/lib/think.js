module.exports = mush => {
  mush.cmds.set("think", {
    pattern: /^think\s+(.*)/i,
    run: (socket, match, scope) => {
      console.log(match[1]);
      mush.broadcast.send(socket, mush.run(match[1], scope));
    }
  });
};
