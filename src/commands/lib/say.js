module.exports = mush => {
  mush.cmds.set("say", {
    pattern: /^(?:"|say\s+)(.*)/i,
    restricted: "connected",
    run: (socket, match, scope) => {
      const enactor = mush.db.id(socket.id);
      let conList;
      conList = mush.db.id(enactor.location).contents;
      try {
        conList = mush.db.id(enactor.location).contents;
        mush.broadcast.send(
          socket,
          `You say, "` + mush.parser.run(match[1], scope) + `"`
        );
        mush.broadcast.sendList(
          socket,
          conList,
          `${
            enactor.moniker ? enactor.moniker : enactor.name
          } says "${mush.parser.run(match[1], scope)}"`,
          "connected",
          [enactor.id]
        );
      } catch {
        conList = mush.db.id(enactor.location).contents;
        mush.broadcast.send(socket, `You say, "` + match[1] + `"`);
        mush.broadcast.sendList(
          socket,
          conList,
          `${enactor.moniker ? enactor.moniker : enactor.name} says "${
            match[1]
          }"`,
          "connected",
          [enactor.id]
        );
      }
    }
  });
};
