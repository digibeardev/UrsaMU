module.exports = mush => {
  mush.cmds.set("@alias", {
    pattern: /^@alias\s+(.*)/,
    restriction: "connected",
    run: async (socket, match) => {
      // Pull the information we want from the match array.
      let [name, alias] = match[1].split("=");

      // Since this is going to be a little involved, we're going
      // to use a switch
      const nameCursor = await mush.db.get(alias);

      switch (true) {
        // If the user inputs me for the name
        case name.toLowerCase() === "me" && nameCursor.length <= 0:
          const target = await mush.db.key(socket._key);
          alias = alias.toLowerCase();
          mush.db.update(target._key, { alias });
          mush.broadcast.send(
            socket,
            `%chDone.%cn ${
              target.moniker ? target.moniker : "%ch" + target.name + "%cn"
            }'s alias set to %ch${alias}%cn.`
          );
          break;

        // No match found.
        default:
          mush.broadcast.send(socket, "Sorry, that alias isn't available.");
          break;
      }
    }
  });
};
