module.exports = mush => {
  mush.help.add({
    name: "@alias",
    type: "Command",
    category: "OOC",
    entry: `
@ALIAS

  COMMAND:   @alias <player> = <name>
  ATTRIBUTE: Alias

  Provides an alternate name by which the player is known.  The alternate
  name is only used for players when referenced as '*<name>' or by commands
  that only take playernames (such as page or @stats).  You may not set
  an alias on any other object type.

  When setting an alias, the alias is checked to see that it is both a legal
  player name and not already in use.  Only if both checks succeed is the
  alias set.

Related Topics: @name.
`
  });

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
