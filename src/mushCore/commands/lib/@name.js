module.exports = mush => {
  mush.cmds.set("@name", {
    pattern: /^@name\s+(.+)\s?=\s?(.*)/i,
    restriction: "connected",
    run: async (socket, match) => {
      // Get our variables together.
      let [, target, name] = match;
      const enactor = await mush.db.key(socket._key);

      // Look for the target.
      const curRoom = await mush.db.key(enactor.location);
      if (target.toLowerCase() === "me") {
        socket.name = name;
        target = enactor;
      } else if (target.toLowerCase() === "here") {
        target = curRoom;
        const tarCursor = await mush.db.get(match[1]);
      } else if (tarCursor.length > 0) {
        target = tarCursor;
      } else if (await mush.move.matchExit(curRoom, match[1])) {
        target = await mush.move.matchExit(curRoom, match[1]);
        target = await mush.db.key(target);
      } else {
        mush.broadcast.send(socket, "I can't find that.");
        target = null;
      }

      if (target) {
        // Make sure they have permissions to edit the object.
        if (await mush.flags.canEdit(enactor, target)) {
          await mush.db.update(target._key, { name });
          mush.broadcast.send(
            socket,
            `%chDone%cn. '%ch${target.name}%cn' name changed to '%ch${name}%cn'.`
          );
        } else {
          mush.broadcast.send(socket, "Permission denied.");
        }
      }
    }
  });
};
