module.exports = mush => {
  mush.cmds.set("@alias", {
    pattern: /^@alias\s+(.*)/,
    run: (socket, match, scope) => {
      // Pull the information we want from the match array.
      const [name, alias] = match[1].split("=");

      // Since this is going to be a little involved, we're going
      // to use a switch
      switch (true) {
        // If the user inputs me for the name
        case name.toLowerCase() === "me" && !mush.db.name(alias):
          const target = mush.db.id(socket.id);
          target.alias = alias;
          mush.broadcast.send(
            socket,
            `%chDone.%cn ${target.name}'s alias set to %ch${alias}%cn.`
          );
          mush.db.save();
          break;

        // No match found.
        default:
          mush.broadcast.send(socket, "Sorry, that alias isn't available.");
      }
    }
  });
};
