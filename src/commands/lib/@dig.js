module.exports = mush => {
  mush.parser.cmds.set("@dig", {
    // I haven't come up with a way to document functions and
    // commands yet - so these will likely change, but for now?
    // Hi!,
    pattern: /^@dig(\/teleport|\/tele|\/port)?\s+(.*)/i,
    run: (socket, match, scope) => {
      if (mush.flags.has(socket, "connected admin")) {
        // capture all of the pieces we're going to need in order to
        // dig a 'room'.
        const teleport = match[1];
        currRoom = mush.db.id(socket.id)
          ? mush.db.name(mush.db.id(socket.id).location)
          : "Unknown Room";
        const [name, exits] = match[2].split("=");
        const [toExit, fromExit] = exits.split(",");

        // build the room, exits and link them together.
        const { room, toexit, fromexit } = mush.grid.dig(
          name,
          toExit,
          fromExit
        );
        mush.broadcast.send(
          socket,
          `%chDone%cn. Room %ch${room.name}%cn dug.%r` +
            `%chDone.%cn Exit %ch${toexit.name.split(";")[0]}` +
            `to %ch${room.name}%cn.`
        );
        // If a return exit is specified
        if (fromexit) {
          mush.broadcast.send(
            socket,
            `%chDone.%cn Exit ${fromexit.name} opend to room ${currRoom}`
          );
        }

        // Did they use the teleport flag?
        if (teleport) {
          const player = mush.db.id(socket.id);
          player.location = room.id;
        }

        // Save the database.
        mush.db.save();
      } else {
        mush.broadcast.huh(socket);
      }
    }
  });
};
