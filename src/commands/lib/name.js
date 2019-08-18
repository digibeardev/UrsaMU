module.exports = mush => {
  mush.cmds.set("@name", {
    pattern: /^@name\s?(.+)\s?=\s?(.*)/i,
    restriction: "connected",
    run: (socket, match) => {
      // Get our variables together.
      let [, target, name] = match;
      const enactor = mush.db.id(socket.id);

      // Look for the target.
      const curRoom = mush.db.id(enactor.location);
      if (target.toLowerCase() === "me") {
        target = enactor;
      } else if (target.toLowerCase() === "here") {
        target = curRoom;
      } else if (mush.db.find({ name: match[1] }).length > 0) {
        target = mush.db.find({ name: match[1] });
      } else if (mush.move.matchExit(curRoom, match[1])) {
        target = mush.move.matchExit(curRoom, match[1]);
        target = mush.db.id(target);
      } else {
        mush.broadcast.send(socket, "I can't find that.");
        target = null;
      }

      if (target) {
        // Make sure they have permissions to edit the object.
        if (mush.flags.canEdit(enactor, target)) {
          mush.db.update(target.id, { name });
          mush.db.save();
          mush.broadcast.send(
            socket,
            `%chDone%cn. '%ch${
              target.name
            }%cn' name changed to '%ch${name}%cn'.`
          );
        } else {
          mush.broadcast.send(socket, "Permission denied.");
        }
      }
    }
  });
};
