module.exports = mush => {
  mush.parser.cmds.set("say", {
    pattern: /^say\s(.+)$/i,
    restricted: "connected",
    run: (socket, match, scope) => {}
  });
};
