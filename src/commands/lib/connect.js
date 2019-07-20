const shajs = require("sha.js");

module.exports = mush => {
  mush.cmds.set("connect", {
    pattern: /^connect\s+(.+)\s+(.+)/i,
    run: (socket, match) => {
      const today = new Date();

      // pull the name and password from the regex match object.
      const [, name, password] = match;
      if (!socket.id) {
        // if the socket isn't logged in (no ID) then they can use this command/
        const DBRef = mush.db.name(name);

        // Hash the password and make sure it matches!
        const security = shajs("sha256")
          .update(password)
          .digest("hex");
        // Sweet Success!
        if (DBRef) {
          if (security === DBRef.password) {
            // Add the ID to the socket for easy reference later
            socket.id = DBRef.id;
            // Update the last time their character was modified
            mush.db.update(DBRef.id, { modified: today });
            // Save the db
            mush.db.save();
            // add the socket to the global list.
            mush.sockets.add(socket);
            socket.id = DBRef.id;
            // send a success message!
            mush.broadcast.send(
              socket,
              `Login Successful. Welcome to UrsaMU!\nLast connection was: ${
                DBRef.modified
              }\r\n`
            );
          }

          // Fail attempt.
        } else {
          socket.end(
            "Either that player does not exist, or " +
              "has a different password.\n"
          );
        }
        // Else they're already logged in.  Show a 'Huh?' message.
      } else {
        mush.broadcast.huh(socket);
      }
    }
  });
};
