module.exports = mush => {
  mush.cmds.set("ex/json", {
    pattern: /^e[xample]+\/json\s?(.*)?/,
    restricted: "connected immortal|wizard",
    run: async (socket, data) => {
      const en = await mush.db.key(socket._key);
      let tar = data[1] ? data[1].trim().toLowerCase() : null;
      const curRoom = await mush.db.key(en.location);

      // figure out the target.
      if (tar) {
        if (tar === "me") {
          tar = en;
        } else if (tar === "here") {
          tar = curRoom;
        } else {
          tar = await mush.db.get(tar);
          if (tar) {
            if (Array.isArray(tar)) {
              tar = tar[0];
            } else {
              mush.broadcast.send(socket, "I can't find that object.");
            }
          }
        }
      } else {
        tar = en;
      }

      if (mush.flags.canEdit(en, tar)) {
        delete tar.password;
        mush.broadcast.send(socket, JSON.stringify(tar, null, 4));
      } else {
        mush.broadcast.send(socket, "Permission denied.");
      }
    }
  });
};
