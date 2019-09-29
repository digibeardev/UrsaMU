module.exports = mush => {
  mush.cmds.set("pose", {
    pattern: /^(?::|pose\s+)(.*)/i,
    restricted: "connected",
    run: async (socket, match, scope) => {
      const enactor = await mush.db.key(socket._key);
      const target = await mush.db.key(enactor.location);
      const conList = target.contents;
      try {
        // send a message to the socket
        mush.broadcast.send(
          socket,
          `${
            enactor.moniker ? enactor.moniker : enactor.name
          } ${mush.parser.run(socket._key, match[1], scope)}`
        );

        // send a message to the rest of the room's 'connected' contents.
        mush.broadcast.sendList(
          socket,
          conList,
          `${
            enactor.moniker ? enactor.moniker : enactor.name
          } ${mush.parser.run(socket._key, match[1], scope)}`,
          "connected"
        );
      } catch {
        mush.log.error(error);
      }
    }
  });

  mush.cmds.set("pose2", {
    pattern: /^;(.*)/i,
    restricted: "connected",
    run: async (socket, match, scope) => {
      const enactor = await mush.db.key(socket._key);
      const curRoom = await mush.db.key(enactor.location);
      let conList = curRoom.contents;

      try {
        mush.broadcast.send(
          socket,
          `${enactor.moniker ? enactor.moniker : enactor.name}${mush.parser.run(
            socket._key,
            match[1],
            scope
          )}`
        );

        mush.broadcast.sendList(
          socket,
          conList,
          `${enactor.moniker ? enactor.moniker : enactor.name}${mush.parser.run(
            socket._key,
            match[1],
            scope
          )}`,
          "connected"
        );
      } catch (error) {
        mush.log.error(error);
      }
    }
  });
};
