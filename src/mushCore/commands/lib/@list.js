module.exports = mush => {
  mush.cmds.set("@list", {
    pattern: /^@?list\s+(.*)/,
    restriction: "connected",
    run: async (socket, data) => {
      const en = await mush.db.key(socket._key);
      const type = data[1].toLowerCase();
      if (type === "commands") {
        let list = [];
        // Grab a list of commands
        mush.cmds.forEach((v, k) => {
          // compare commands against helpfile entries
          if (mush.help.help.has(k)) {
            if (mush.flags.hasFlags(en, v.restriction)) {
              list.push(k);
            }
          } else if (
            !mush.help.help.has(k) &&
            mush.flags.hasFlags(en, "wizard|Immortal|royalty")
          ) {
            // Color entries that don't have help files (For wizards)
            list.push(`%cr${k}%cn`);
          }
        });
        // display results
        mush.broadcast.send(
          socket,
          `%cr---%cn[ljust(%ch%cr<<%cn %ch@list Commands %cr>>%cn,75,%cr-%cn)]%r%r` +
            `[columns(${list.join(" ")},4)]%r%r` +
            `[repeat(%cr-%cn,78)]`
        );
      }
    }
  });
};
