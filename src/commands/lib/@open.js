module.exports = mush => {
  mush.cmds.set("@open", {
    pattern: /^@open\s+(.*)\s?=\s?(.*)?/i,
    restricted: "connected admin",
    run: (socket, data) => {
      const enactor = mush.db.id(socket.id);
      const curRoom = mush.db.id(enactor.location);
      let toExit = data[1].trim();
      let [room, fromExit] = data[2].split(",");

      // Build the initial exit.
      toExit = mush.db.insert({
        name: toExit.trim(),
        owner: enactor.id,
        type: "exit",
        to: room.id
      });

      // If a room dbref is given, link from the enactor's
      // current location to the requested room.
      if (room) {
        room = mush.db.id(room);
        if (!room) {
          mush.broadcast.send(socket, "That room doesn't exist.");
        } else {
          mush.broadcast.send(
            socket,
            `%chDone%cn. Exit '%ch${toExit.name.split(";")[0]}%cn' opened ` +
              `and linked to room '%ch${room.name.trim()}%cn'.`
          );
          mush.db.update(curRoom.id, { exits: [...curRoom.exits, toExit.id] });
          mush.db.update(toExit.id, { to: room.id, from: curRoom.id });
        }
      }

      // If a from exit is specified, connect an exit from that room, to
      // the user's current location.
      if (fromExit) {
        fromExit = mush.db.insert({
          name: fromExit.trim(),
          location: room.id,
          to: curRoom.id,
          from: room.id,
          owner: enactor.id
        });
        mush.db.update(room.id, { exits: [...room.exits, fromExit.id] });
        mush.broadcast.send(
          socket,
          `%chDone%cn. Exit '%ch${fromExit.name
            .split(";")[0]
            .trim()}%cn' openend and linked to room '%ch${curRoom.name.trim()}%cn'`
        );
      }

      mush.db.save();
    }
  });
};
