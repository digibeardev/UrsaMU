module.exports = mush => {
  mush.cmds.set("@destroy", {
    pattern: /^@?destroy\s+(.*)/i,
    restriction: "connected",
    run: (socket, data) => {
      const enactor = mush.db.id(socket.id);
      const target = mush.db.name(data[1])
        ? mush.db.name(data[1])
        : mush.db.id(data[1]);
      const canEdit = mush.flags.canEdit(enactor, target);
      if (target) {
        if (canEdit && mush.flags.hasFlags(target, "!safe")) {
          let index = mush.db.db.indexOf(target);
          mush.db.db.splice(index, 1);
          curLocation = mush.db.id(target.location);
          // Check current location for objects and exits to remove.

          const conIndex = curLocation.contents.indexOf(target.id);
          if (conIndex !== -1) curLocation.contents.splice(conIndex, 1);

          const exIndex = curLocation.contents.indexOf(target.id);
          if (exIndex !== -1) curLocation.exits.splice(exIndex, 1);

          mush.db.update(curLocation.id, { contents: curLocation.contents });
          mush.db.update(curLocation.id, { exits: curLocation.exits });

          mush.db.save();
          mush.broadcast.send(
            socket,
            `Done. Object '%ch${mush.name(
              enactor,
              target
            )}%cn' has been destroyed.`
          );
        } else if (canEdeit && mush.flags.hasFlags(target, "safe")) {
          mush.broadcast.send(
            socket,
            "That object is protected. Use %ch@destroy/override%cn to continue."
          );
        } else {
          mush.broadcast.send(socket, "Permission denied.");
        }
      } else {
        mush.broadcast.send(socket, "I can't find that.");
      }
    }
  });
};
