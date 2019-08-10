module.exports = mush => {
  mush.cmds.set("@nameFormat", {
    pattern: /^@?nameformat\s+(.*)\s?=\s?(.*)/,
    restriction: "connected",
    run: (socket, data) => {
      const [, tarName, namefmt] = data;
      let target;

      const enactor = mush.db.id(socket.id);
      // Get the target dbref information
      if (tarName.trim() === "me") {
        target = mush.db.id(socket.id);
      } else if (tarName.trim() === "here") {
        target = mush.db.id(enactor.location);
      } else {
        target = mush.db.id(tarName);
      }

      if (mush.flags.canEdit(enactor, target)) {
        target.nameFormat = namefmt;
        mush.broadcast.send(
          socket,
          `Done. Name format set for %ch${target.name}%cn.`
        );
        mush.db.save();
      } else {
        mush.broadcast.send(socket, "Permission dened.");
      }
    }
  });
};
