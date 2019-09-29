module.exports = mush => {
  mush.cmds.set("say", {
    pattern: /^(?:"|say\s+)(.*)/i,
    restricted: "connected",
    run: async (socket, match, scope) => {
      if (socket._key) {
        // Get enactor information from socket,
        const enactor = await mush.db.key(socket._key);
        let curRoom = await mush.db.key(enactor.location);
        try {
          mush.broadcast.send(
            socket,
            `You say, "` + mush.parser.run(socket._key, match[1], scope) + `"`
          );
          mush.broadcast.sendList(
            socket,
            curRoom.contents,
            `${
              enactor.moniker ? enactor.moniker : enactor.name
            } says "${mush.parser.run(socket._key, match[1], scope)}"`,
            "connected"
          );
        } catch {
          mush.broadcast.send(
            socket,
            mush.parser.subs(`You say, "` + match[1] + `"`)
          );
          mush.broadcast.sendList(
            socket,
            curRoom.contents,
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
