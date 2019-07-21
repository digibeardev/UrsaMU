module.exports = mush => {
  mush.cmds.set("@name", {
    pattern: /^@name\s?(.+)\s?=\s?(.*)/i,
    run: (socket, match, scope) => {
      // Get our variables together.
      const [, target, name] = match;
      let DBRef =
        target.toLowerCase() === "me"
          ? mush.db.id(socket.id)
          : mush.db.name(target);
      const oldName = DBRef.name;
      const enactor = mush.db.id(socket.id);
      if (mush.flags.canEdit(enactor, DBRef)) {
        DBRef = mush.db.update(DBRef.id, { name });
        mush.db.save();
        mush.broadcast.send(
          socket,
          `%chDone%cn. Name changed from %ch${oldName}%cn to %ch${
            DBRef.name
          }%cn.`
        );
      } else {
        mush.broadcast.huh(socket);
      }
    }
  });
};
