module.exports = mush => {
  mush.cmds.set("inventory", {
    pattern: /^(?:i|i[nventory]+)/i,
    restriction: "connected",
    run: async socket => {
      const enactor = await mush.db.key(socket._key);
      let output;
      if (enactor.contents.length <= 0) {
        output = "You aren't carrying anything.";
      } else {
        output = "You are carrying:";
      }

      for (const item of enactor.contents) {
        const itm = await mush.db.key(item);
        if (itm.type !== "exit") {
          output += `\n${await mush.name(enactor, itm)}`;
        }
      }
      mush.broadcast.send(socket, output);
    }
  });
};
