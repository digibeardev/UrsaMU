shajs = require("sha.js");

module.exports = parser => {
  /**
   * Create a new player bit
   * @param {string[]} args THe array of matches from the regular
   * expression passed to this variable.
   * @param {Object} args.socket The socket that issued the command.
   * @param {string} args.name The name of the character to be created.
   * @param {string} args.password The desired password for the character.
   */
  const create = (socket, match, scope) => {
    // Make sure the socket doesn't already have an ID (isn't already logged in)
    if (!socket.id) {
      // extract the values we want from the args param.
      const [full, name, password] = match;
      // Make sure it's a unique name!  If the database returns
      // any names (Upper or lowercase!) then it should send the
      // failure message.
      if (!parser.db.name(name) && !parser.db.name(name.toLowerCase())) {
        // Create the new entry into the database.
        parser.db.update({
          name,
          // Gotta secure them passwords! In the future we might want
          // to use something stronger than SHA256.  Ultimately I'd like
          // people to be able to log in with their google ID or Facebook
          // or whatever...
          password: shajs("sha256")
            .update(password)
            .digest("hex"),
          type: "player"
        });
        parser.broadcast.send(
          socket,
          "Welcome to the world of UrsaMU. Explore places." +
            "Meet people.  Have fun! If you need help, just ask somebody (type a double" +
            ' quote mark and then type your question, like this:\n\n"How do I keep' +
            " people from picking me up? The question will appear to others in the" +
            ' same room as:\n\n <yourname> says "How do I keep people from picking me up?\n'
        );
        parser.db.save();
      } else {
        parser.broadcast.send(
          socket,
          "Either there is already a player" +
            " with that name, or that name is illegal."
        );
      }
      // Socket already has an attached ID.
    } else {
      parser.broadcast.send(socket, "Huh? Type (help) for help.");
    }
  };

  parser.cmds.set("create", {
    pattern: /^create\s+(.+)\s+(.+)/g,
    run: (socket, match, scope) => create(socket, match, scope)
  });
};
