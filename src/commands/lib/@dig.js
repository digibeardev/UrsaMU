module.exports = mush => {
  mush.cmds.set("@dig", {
    // I haven't come up with a way to document functions and
    // commands yet - so these will likely change, but for now?
    // Hi!,
    pattern: /^@dig(\/tel[eport]+)?\s+(.*)/i,
    restriction: "admin",
    run: (socket, match) => {
      // Deconstruct a whole mess of arguments!
      const [, teleport, args] = match;
      const [name, exits] = args.split("=");
      let toexit, fromexit, toExit, fromExit;
      if (exits) {
        [toExit, fromExit] = exits.split(",");
      }

      const enactor = mush.db.id(socket.id);
      const curRoom = mush.db.id(enactor.location);

      // Check to see if the player has permissions to dig new
      // rooms from this location.
      if (mush.flags.canEdit(enactor, curRoom)) {
        // Create the new room
        const room = mush.db.insert({
          name: name.trim(),
          type: "room",
          owner: socket.id,
          exits: []
        });
        mush.broadcast.send(
          socket,
          `%chDone.%cn Room %ch${room.name.trim()}(#${room.id})%cn dug.`
        );

        // If a 'to' exit is defined, create the db reference and link.
        if (toExit) {
          toexit = mush.db.insert({
            name: toExit.trim(),
            type: "exit",
            owner: enactor.id,
            location: enactor.location,
            to: room.id,
            from: curRoom.id
          });

          mush.db.update(curRoom.id, { exits: [...curRoom.exits, toexit.id] });
          mush.broadcast.send(
            socket,
            `%chDone.%cn Exit %ch${
              toexit.name.split(";")[0]
            }%cn opened to room %ch${room.name}%cn.`
          );
        }

        if (fromExit) {
          fromexit = mush.db.insert({
            name: fromExit.trim(),
            type: "exit",
            owner: enactor.id,
            location: room.id,
            to: curRoom.id,
            from: room.id
          });

          mush.db.update(room.id, { exits: [...room.exits, fromexit.id] });
          mush.broadcast.send(
            socket,
            `%chDone.%cn Exit %ch${
              fromexit.name.split(";")[0]
            }%cn opened to room %ch${curRoom.name}%cn.`
          );
        }
        mush.db.save();
      } else {
        mush.broadcast.send(socket, "Permission denied.");
      }
    }
  });
};
