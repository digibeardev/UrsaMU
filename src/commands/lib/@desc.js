module.exports = mush => {
  mush.cmds.set("@description", {
    pattern: /^@des[cription]+?\s?(.*)\s?=\s?(.*)/i,
    restriction: "connected",
    run: async (socket, match) => {
      let [, name, desc] = match;
      const enactor = await mush.db.key(socket._key);
      let target;

      targets = await mush.db.get(target);
      tar = await targets[0];
      // Check to see if target is equal to some common
      // shortcut entries.
      if (name.toLowerCase().trim() === "me") {
        target = enactor;
      } else if (name.toLowerCase().trim() === "here") {
        target = await mush.db.key(enactor.location);
      } else if (tar) {
        target = tar;
      } else {
        target = false;
      }

      const canEdit = await mush.flags.canEdit(enactor, target);

      if (canEdit && target) {
        if (!desc) desc = "You see nothing special.";

        await mush.db.update(target._key, { description: desc });
        mush.broadcast.send(
          socket,
          `%chDone.%cn Description changed for %ch${target.name}.%cn`
        );
      } else {
        mush.broadcast.send(socket, "Permission denied.");
      }
    }
  });
};
