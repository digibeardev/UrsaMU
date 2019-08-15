module.exports = mush => {
  mush.cmds.set("say", {
    pattern: /^(?:"|say\s+)(.*)/i,
    restricted: "connected",
    run: (socket, match, scope) => {
      if (socket.id) {
        // Get enactor information from socket,
        const enactor = mush.db.id(socket.id);
        try {
          // Get a list of contents from the enactor's current location.
          let conList = mush.db.id(enactor.location).contents;
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
            "connected"
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
            "connected"
          );
        }
      }
    }
  });
};
