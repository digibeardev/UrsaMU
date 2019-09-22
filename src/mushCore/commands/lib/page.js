module.exports = mush => {
  mush.cmds.set("page", {
    pattern: /(?:^p|^page) ((.*)\s?=\s?)?(.*)/,
    restruction: "connected",
    run: async (socket, data) => {
      // Build the target list
      const list = [];
      const enactor = await mush.db.key(socket._key);

      if (data[2]) {
        for (const tar of data[2].split(" ")) {
          let target = await mush.db.get(tar);

          if (target.length > 0) {
            target = target[0];
            list.push(target);
          }
        }

        // Save the target list for future pages.
        socket.page = list;
      } else if (socket.page.length > 0) {
        // Use stored list instead
        for (const tar of socket.page) {
          if (tar) {
            list.push(tar);
          }
        }
      } else {
        // No list, provided or stored.
        return mush.broadcast.send(socket, "Who are you trying to page?");
      }

      data[3] = data[3].trim();
      let message;
      let ignore = [];
      ignore.push(enactor);

      if (data[3][0] === ":") {
        message = enactor.moniker
          ? enactor.moniker + " " + data[3].slice(1)
          : enactor.name + " " + data[3].slice(1);
      } else if (data[3][0] === ";") {
        message = enactor.moniker
          ? enactor.moniker + data[3].slice(1)
          : enactor.name + data[3].slice(1);
      } else {
        message = enactor.moniker
          ? enactor.moniker + " pages: " + data[3]
          : enactor.name + " pages: " + data[3];
      }

      mush.broadcast.sendGroup({
        enactor,
        targets: list,
        message,
        flags: "connected",
        ignore
      });
    }
  });
};
