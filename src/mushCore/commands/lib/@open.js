module.exports = mush => {
  mush.cmds.set("@open", {
    pattern: /^@open\s+(.*)\s?=\s?(.*)?/i,
    restricted: "connected immortal|wizard|royalty",
    run: async (socket, data) => {
      try {
        const enactor = await mush.db.key(socket._key);
        const curRoom = await mush.db.key(enactor.location);
        let toExit = data[1].trim();
        let [room, fromExit] = data[2].split(",");

        // Build the initial exit.
        toExit = await mush.db.insert({
          name: toExit.trim(),
          owner: enactor._key,
          type: "exit",
          to: room._key
        });
        toExit = await mush.db.key(toExit._key);

        // If a room dbref is given, link from the enactor's
        // current location to the requested room.
        if (room) {
          room = await mush.db.key(room);
          if (!room) {
            mush.broadcast.send(socket, "That room doesn't exist.");
          } else {
            mush.broadcast.send(
              socket,
              `%chDone%cn. Exit '%ch${toExit.name.split(";")[0]}%cn' opened ` +
                `and linked to room '%ch${room.name.trim()}%cn'.`
            );
            curRoom.exits = [...curRoom.exits, toExit._key];
            await mush.db.update(curRoom._key, { exits: curRoom.exits });
            await mush.db.update(toExit._key, {
              to: room._key,
              from: curRoom._key
            });
          }
        }

        // If a from exit is specified, connect an exit from that room, to
        // the user's current location.
        if (fromExit) {
          fromExit = await mush.db.insert({
            name: fromExit.trim(),
            location: room._key,
            to: curRoom._key,
            from: room._key,
            owner: enactor._key
          });
          fromExit = await mush.db.key(fromExit._key);
          room.exits = [...room.exits, fromExit._key];
          await mush.db.update(room._key, { exits: room.exits });
          mush.broadcast.send(
            socket,
            `%chDone%cn. Exit '%ch${fromExit.name
              .split(";")[0]
              .trim()}%cn' openend and linked to room '%ch${curRoom.name.trim()}%cn'`
          );
        }
      } catch (error) {
        mush.log.error(error);
      }
    }
  });
};
