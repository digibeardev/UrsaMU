module.exports = mush => {
  mush.cmds.set("@lock", {
    pattern: /^@?lock(\/\w+)?\s+?(.*)/i,
    restriction: "connected",
    run: async (socket, data) => {
      const lock = data[1] ? data[1].slice(1) : "default";
      const [obj, key] = data[2].split("=");

      const en = await mush.db.key(socket._key);
      let tar;
      if (obj.toLowerCase() === "me") {
        tar = en;
      } else if (obj.toLowerCase() === "here") {
        tar = await mush.db.key(en.location);
      } else {
        tar = await mush.db.get(obj);
        tar = tar ? tar[0] : false;
      }

      if (tar) {
        const { err } = await mush.locks.lock({ en, tar, lock, key });
        if (err) mush.broadcast.send(socket, err);
        mush.broadcast.send(
          socket,
          `%chDone%cn. Lock '%ch${lock}%cn' set on '${
            tar.moniker ? tar.moniker : "%ch" + tar.name + "%cn"
          }'.`
        );
      } else {
        mush.broadcast.send(socket, "I can't find that.");
      }
    }
  });

  mush.cmds.set("@unlock", {
    pattern: /^@?unlock(\/\w+)?\s+?(.*)/i,
    restriction: "connected",
    run: async (socket, data) => {
      const lock = data[1] ? data[1].slice(1) : "default";

      const en = await mush.db.key(socket._key);

      let tar;
      if (data[2].toLowerCase() === "me") {
        tar = en;
      } else if (data[2].toLowerCase() === "here") {
        tar = await mush.db.key(en.location);
      } else {
        tar = await mush.db.get(data[2]);
        tar = tar ? tar[0] : false;
      }

      if (tar) {
        const { err } = await mush.locks.unlock({ en, tar, lock });
        if (err) mush.broadcast.send(socket, err);
        mush.broadcast.send(
          socket,
          `%chDone%cn. Lock '%ch${lock}%cn' removed from '${
            tar.moniker ? tar.moniker : "%ch" + tar.name + "%cn"
          }'.`
        );
      } else {
        mush.broadcast.send(socket, "I can't find that.");
      }
    }
  });
};
