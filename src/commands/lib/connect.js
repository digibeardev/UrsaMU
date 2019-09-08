const shajs = require("sha.js");

module.exports = mush => {
  mush.cmds.set("connect", {
    pattern: /^c[onnect]+\s+(.+)\s+(.+)/i,
    run: async (socket, match) => {
      const today = new Date();

      // pull the name and password from the regex match object.
      const [, name, password] = match;
      if (!socket.id) {
        // if the socket isn't logged in (no ID) then they can use this command/
        const dbRef = await mush.db.get(name)[0];
        const authenticated = dbRef.comparePassword(password);

        if (authenticated) {
          socket.id = dbRef.id;
          dbRef.modified = new Date.now();
          dbRef.save();
          mush.queues.sockets.add(socket);
          mush.broadcast.send(
            socket,
            `%chLogin Successful%cn. Welcome to %chUrsaMU!%cn`
          );
          mush.exe(socket, "look", ["here"]);
          mush.emitter.emit("connected", socket);
        } else {
          mush.broadcast.send(
            socket,
            "Either that player does not exist, or " +
              "has a different password."
          );
          socket.attempts += 1;
          if (attempts === 2) {
            socket.end();
          }
        }

        // Sweet Success!
        if (DBRef) {
          if (security === DBRef.password) {
            socket.id = DBRef.id;
            const last = new Date(DBRef.last);
            // send a success message!

            mush.exe(socket, "look", ["here"]);
            mush.emitter.emit("connected", socket);
          }

          // Fail attempt.
        } else {
          mush.broadcast.send(
            socket,
            "Either that player does not exist, or " +
              "has a different password."
          );
          socket.end();
        }
        // Else they're already logged in.  Show a 'Huh?' message.
      } else {
        mush.broadcast.huh(socket);
      }
    }
  });
};
