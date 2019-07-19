const shajs = require("sha.js");
const fs = require("fs");
const path = require("path");

module.exports = mush => {
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
      const [full, name = " ", password = " "] = match;
      // Make sure it's a unique name!  If the database returns
      // any names (Upper or lowercase!) then it should send the
      // failure message.
      if (!mush.db.name(name.toLowerCase())) {
        // Create the new entry into the database.
        mush.db.update({
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
        // The player was able to make it through the signup process!  Now let's
        // give them a boxed new player welcome.
        mush.broadcast.send(
          socket,
          fs.readFile(
            path.resolve(__dirname, "../../../data/text/newconnect.txt"),
            (err, data) => {
              if (err) throw err;
              mush.broadcast.send(socket, data.toString());
            }
          )
        );
        socket.id = mush.db.name(name).id;
        mush.flags.set(socket, "connected");
        mush.db.save();
      } else {
        mush.broadcast.send(
          socket,
          "Either there is already a player" +
            " with that name, or that name is illegal."
        );
      }
      // Socket already has an attached ID.
    } else {
      mush.broadcast.send(socket, `Huh? Type "Help" for help.`);
    }
  };

  // This is where we actually wire the command with the mush
  // system.
  mush.parser.cmds.set("create", {
    pattern: /^create\s+(.+)\s+(.+)/i,
    run: (socket, match, scope) => create(socket, match, scope)
  });
};
