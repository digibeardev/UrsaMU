module.exports = mush => {
  mush.cmds.set("@parent", {
    pattern: /^@parent\s+(.*)\s?=\s?(.*)?/i,
    restricted: "connected immortal|wizard|royalty",
    run: (socket, data) => {
      const enactor = mush.db.id(socket.id);
      const curRoom = mush.db.id(enactor.location);
      let [, target, parent] = data;

      // Check to see if our target is valid
      if (mush.db.id(target)) {
        target = mush.db.id(target);
      } else if (target === "here") {
        target = curRoom;
      } else if (target === "me") {
        target = enactor;
      } else {
        return mush.broadcast.send(socket, "I can't find that target.");
      }

      // Check to see if parent is valid
      if (mush.db.id(parent)) {
        parent = mush.db.id(parent);
      } else {
        return mush.broadcast.send(socket, "I can't find that parent.");
      }

      // Save the parent info to the target.
      mush.db.update(target.id, { parent: parent.id });
      mush.db.save();
      mush.broadcast.send(
        socket,
        `%chDone%cn. Parent object for '%ch${target.name}%cn' set to '%ch${
          parent.name
        }%cn'.`
      );
    }
  });
};
