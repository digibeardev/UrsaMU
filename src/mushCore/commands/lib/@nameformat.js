module.exports = mush => {
  mush.cmds.set("@nameformat", {
    pattern: /^@?nameformat\s+([\w]+)\s?=\s?(.*)?/i,
    restriction: "connected immortal|wizard|royalty",
    run: async (socket, data) => {
      let tar = data[1].trim();
      let value = data[2] || "";
      let en = await mush.db.key(socket._key);
      let curRoom = await mush.db.key(en.location);

      if (tar === "me") {
        tar = en;
      } else if (tar === "here") {
        tar = curRoom;
      } else {
        tar = mush.db.get(tar);
        if (Array.isArray(tar)) {
          tar = tar[0];
        }
      }

      if (await mush.flags.canEdit(en, tar)) {
        let results = await mush.attrs.set({
          key: tar._key,
          name: "nameformat",
          value,
          setBy: en._key
        });
        if (results) {
          mush.broadcast.send(
            socket,
            `%chDone%cn. '%ch@nameformat%cn' ${value ? "Set." : "removed."}`
          );
        }
      } else {
        mush.broadcast.send(socket, "Permissin denied.");
      }
    }
  });

  mush.cmds.set("@descformat", {
    pattern: /^@?descformat\s+([\w]+)\s?=\s?(.*)?/i,
    restriction: "connected immortal|wizard|royalty",
    run: async (socket, data) => {
      let tar = data[1].trim();
      let value = data[2] || "";
      let en = await mush.db.key(socket._key);
      let curRoom = await mush.db.key(en.location);

      if (tar === "me") {
        tar = en;
      } else if (tar === "here") {
        tar = curRoom;
      } else {
        tar = mush.db.get(tar);
        if (Array.isArray(tar)) {
          tar = tar[0];
        }
      }

      if (await mush.flags.canEdit(en, tar)) {
        let results = await mush.attrs.set({
          key: tar._key,
          name: "descformat",
          value,
          setBy: en._key
        });
        if (results) {
          mush.broadcast.send(
            socket,
            `%chDone%cn. '%ch@descformat%cn' ${value ? "Set." : "removed."}`
          );
        }
      } else {
        mush.broadcast.send(socket, "Permissin denied.");
      }
    }
  });

  mush.cmds.set("@conformat", {
    pattern: /^@?conformat\s+([\w]+)\s?=\s?(.*)?/i,
    restriction: "connected immortal|wizard|royalty",
    run: async (socket, data) => {
      let tar = data[1].trim();
      let value = data[2] || "";
      let en = await mush.db.key(socket._key);
      let curRoom = await mush.db.key(en.location);

      if (tar === "me") {
        tar = en;
      } else if (tar === "here") {
        tar = curRoom;
      } else {
        tar = mush.db.get(tar);
        if (Array.isArray(tar)) {
          tar = tar[0];
        }
      }

      if (await mush.flags.canEdit(en, tar)) {
        let results = await mush.attrs.set({
          key: tar._key,
          name: "conformat",
          value,
          setBy: en._key
        });
        if (results) {
          mush.broadcast.send(
            socket,
            `%chDone%cn. '%ch@conformat%cn' ${value ? "Set." : "removed."}`
          );
        }
      } else {
        mush.broadcast.send(socket, "Permissin denied.");
      }
    }
  });

  mush.cmds.set("@exitformat", {
    pattern: /^@?exitformat\s+([\w]+)\s?=\s?(.*)?/i,
    restriction: "connected immortal|wizard|royalty",
    run: async (socket, data) => {
      let tar = data[1].trim();
      let value = data[2] || "";
      let en = await mush.db.key(socket._key);
      let curRoom = await mush.db.key(en.location);

      if (tar === "me") {
        tar = en;
      } else if (tar === "here") {
        tar = curRoom;
      } else {
        tar = mush.db.get(tar);
        if (Array.isArray(tar)) {
          tar = tar[0];
        }
      }

      if (await mush.flags.canEdit(en, tar)) {
        let results = await mush.attrs.set({
          key: tar._key,
          name: "exitformat",
          value,
          setBy: en._key
        });
        if (results) {
          mush.broadcast.send(
            socket,
            `%chDone%cn. '%ch@exitformat%cn' ${value ? "Set." : "removed."}`
          );
        }
      } else {
        mush.broadcast.send(socket, "Permissin denied.");
      }
    }
  });
};
