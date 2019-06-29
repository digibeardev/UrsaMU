module.exports = mush => {
  mush.cmds.set("say", {
    pattern: /^say\s(.+)$/i,
    restricted: "connected",
    run: (socket, match, scope) => {}
  });
};
