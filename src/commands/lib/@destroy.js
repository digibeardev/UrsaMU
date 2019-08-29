module.exports = mush => {
  mush.cmds.set("@destroy", {
    pattern: /^@?destroy\s+(.*)/i,
    restriction: "connected",
    run: (socket, data) => {
      const enactor = mush.db.id(socket.id);
      const target = mush.db.name(data[1]);
      const canEdit = mush.flags.canEdit(enactor, target);
      if (canEdit && mush.flags.hasFlags(target, "!safe")) {
        let index = mush.db.db.indexOf(target);
        mush.db.db.splice(index, 1);
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
    }
  });
};
