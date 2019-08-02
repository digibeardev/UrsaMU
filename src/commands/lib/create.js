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
  const create = (socket, match) => {
    // Make sure the socket doesn't already have an ID (isn't already logged in)
    if (!socket.id) {
      // Check to see if any player objects have been created yet.  If not, the very
      // first one made is going to have our 'god' flag.
      const players = mush.db.find({ type: "player" });
      const room = mush.db.id(mush.config.get("startingRoom"));

      // extract the values we want from the args param.
      const [, name = " ", password = " "] = match;

      // Make sure it's a unique name!  If the database returns
      // any names (Upper or lowercase!) then it should send the
      // failure message.
      if (!mush.db.name(name.toLowerCase())) {
        // Create the new entry into the database.
        const enactor = mush.db.insert({
          name,
          location: mush.config.get("startingRoom"),
          // Gotta secure them passwords! In the future we might want
          // to use something stronger than SHA256.  Ultimately I'd like
          // people to be able to log in with their google ID or Facebook
          // or whatever...
          password: shajs("sha256")
            .update(password)
            .digest("hex"),
          type: "player"
        });

        // Add the new player to the contents of the starting room.
        mush.db.update(room.id, { contents: [...room.contents, enactor.id] });

        // The player was able to make it through the signup process!  Now let's
        // give them a boxed new player welcome.
        mush.broadcast.send(socket, mush.txt.get("newconnect.txt") + "\r\n");
        socket.id = enactor.id;

        mush.exe(socket, "look", []);

        // Add the new player to the contents of the starting room.
        mush.db.update(room.id, { contents: [...room.contents, enactor.id] });

        let setFlags;
        // If no players exist, assign the 'god' flag to the first player made
        // on the db. This is something that'll be handled through the web portal
        // game setup.
        if (players.length <= 0) {
          setFlags = mush.flags.set(socket, "architect connected");
          // Or it's just a regular player bit.  Skip the extra flag.
        } else {
          setFlags = mush.flags.set(socket, "connected");
        }
        mush.db.update(socket.id, setFlags);
        mush.db.save();
      } else {
        mush.broadcast.send(
          socket,
          "Either there is already a player" +
            " with that name, or that name is illegal.\r"
        );
      }
      // Socket already has an attached ID.
    } else {
      mush.broadcast.huh(socket);
    }
  };

  // This is where we actually wire the command with the mush
  // system.
  mush.cmds.set("create", {
    pattern: /^create\s+(.+)\s+(.+)/i,
    run: (socket, match, scope) => create(socket, match, scope)
  });
};
