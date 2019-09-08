module.exports = mush => {
  mush.cmds.set("@description", {
    pattern: /^@des[cription]+?\s?(.*)\s?=\s?(.*)/i,
    restriction: "connected",
    run: (socket, match) => {
      let [, name, desc] = match;
      const enactor = mush.db.id(socket.id);
      let target;

      // Check to see if target is equal to some common
      // shortcut entries.
      if (name.toLowerCase().trim() === "me") {
        target = enactor;
      } else if (name.toLowerCase().trim() === "here") {
        target = mush.db.id(enactor.location);
      } else if (mush.db.name(target)) {
        target = mush.db.name(target);
      } else {
        target = false;
      }

      if (
        target &&
        (enactor.id === target.id ||
          enactor.locaation === target.location ||
          mush.flags.canEdit(enactor, target))
      ) {
        if (!desc) desc = "You see nothing special.";
        mush.db.update(target.id, { description: desc });
        mush.db.save();
        mush.broadcast.send(
          socket,
          `%chDone.%cn Description changed for %ch${target.name}.%cn`
        );
      } else {
        mush.broadcast.send(socket, "I can't find that here.");
      }
    }
  });
};
