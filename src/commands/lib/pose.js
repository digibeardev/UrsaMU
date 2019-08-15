module.exports = mush => {
  mush.cmds.set("pose", {
    pattern: /^(?::|pose\s+)(.*)/i,
    restricted: "connected",
    run: (socket, match, scope) => {
      const enactor = mush.db.id(socket.id);
      let conList;
      conList = mush.db.id(enactor.location).contents;
      try {
        // send a message to the socket
        mush.broadcast.send(
          socket,
          `${
            enactor.moniker ? enactor.moniker : enactor.name
          } ${mush.parser.run(match[1], scope)}`
        );

        // send a message to the rest of the room's 'connected' contents.
        conList = mush.db.id(enactor.location).contents;
        mush.broadcast.sendList(
          socket,
          conList,
          `${
            enactor.moniker ? enactor.moniker : enactor.name
          } ${mush.parser.run(match[1], scope)}`,
          "connected"
        );
      } catch {
        // send a message to the socket that doesn't have any parsing needed.
        mush.broadcast.send(
          socket,
          `${enactor.moniker ? enactor.moniker : enactor.name} ${(match[1],
          scope)}`
        );

        // Send a message to the rest of the locations contents.
        conList = mush.db.id(enactor.location).contents;
        mush.broadcast.sendList(
          socket,
          conList,
          `${enactor.moniker ? enactor.moniker : enactor.name} ${match[1]}`,
          "connected"
        );
      }
    }
  });

  mush.cmds.set("pose2", {
    pattern: /^;(.*)/i,
    restricted: "connected",
    run: (socket, match, scope) => {
      const enactor = mush.db.id(socket.id);
      let conList;
      conList = mush.db.id(enactor.location).contents;
      try {
        conList = mush.db.id(enactor.location).contents;
        mush.broadcast.sendList(
          conList,
          `${enactor.moniker ? enactor.moniker : enactor.name}${mush.parser.run(
            match[1],
            scope
          )}`,
          "connected"
        );
      } catch {
        conList = mush.db.id(enactor.location).contents;
        mush.broadcast.sendList(
          socket,
          conList,
          `${enactor.moniker ? enactor.moniker : enactor.name}${match[1]}`,
          "connected"
        );
      }
    }
  });
};
