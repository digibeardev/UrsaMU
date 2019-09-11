module.exports = mush => {
  mush.cmds.set("@dig", {
    // I haven't come up with a way to document functions and
    // commands yet - so these will likely change, but for now?
    // Hi!,
    pattern: /^@dig(\/tel[eport]+)?\s+(.*)/i,
    restriction: "connected immortal|wizard|royalty",
    run: async (socket, match) => {
      // Deconstruct a whole mess of arguments!
      const [, teleport, args] = match;
      const [name, exits] = args.split("=");
      let toexit, fromexit, toExit, fromExit;
      if (exits) {
        [toExit, fromExit] = exits.split(",");
      }

      try {
        const enactor = await mush.db.key(socket._key);
        const curRoom = await mush.db.key(enactor.location);

        // Check to see if the player has permissions to dig new
        // rooms from this location.
        if (await mush.flags.canEdit(enactor, curRoom)) {
          // Create the new room
          let room = await mush.db.insert({
            name: name.trim(),
            type: "room",
            owner: socket._key,
            exits: []
          });

          room = await mush.db.key(room._key);

          mush.broadcast.send(
            socket,
            `%chDone.%cn Room %ch${room.name.trim()}(#${room._key})%cn dug.`
          );

          // If a 'to' exit is defined, create the db reference and link.
          if (toExit) {
            toexit = await mush.db.insert({
              name: toExit.trim(),
              type: "exit",
              owner: enactor._key,
              location: enactor.location,
              to: room._key,
              from: curRoom._key
            });

            toexit = await mush.db.key(toexit._key);

            await mush.db.update(curRoom._key, {
              exits: [...curRoom.exits, toexit._key]
            });
            mush.broadcast.send(
              socket,
              `%chDone.%cn Exit %ch${
                toexit.name.split(";")[0]
              }%cn opened to room %ch${room.name}%cn.`
            );
          }

          if (fromExit) {
            fromexit = await mush.db.insert({
              name: fromExit.trim(),
              type: "exit",
              owner: enactor._key,
              location: room._key,
              to: curRoom._key,
              from: room._key
            });

            fromexit = await mush.db.key(fromexit._key);

            mush.db.update(room._key, {
              exits: [...room.exits, fromexit._key]
            });
            mush.broadcast.send(
              socket,
              `%chDone.%cn Exit %ch${
                fromexit.name.split(";")[0]
              }%cn opened to room %ch${curRoom.name}%cn.`
            );
          }
        } else {
          mush.broadcast.send(socket, "Permission denied.");
        }
      } catch (error) {
        mush.log.error(error);
      }
    }
  });
};
