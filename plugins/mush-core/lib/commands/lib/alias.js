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

  mush.parser.cmds.set("@alias", {
    pattern: /^@alias\s+(.*)/,
    run: (socket, match, scope) => {
      const [name, alias] = match[1].split("=");
      // Check if 'name' is valid
      if (mush.db.name(name) || name.toLowerCase() === "me") {
        if (!mush.db.name(alias)) {
          mush.db.name(name).alias = alias;
          socket.broadcast.send(
            socket,
            `%chDone.%cn ${name}s alias has been set to ${alias}.`
          );
        } else {
          mush.broadcast.send(socket, "That alias is already taken");
        }
      } else {
        mush.socket.send(socket, "I can't find that player.");
      }
    }
  });
};
