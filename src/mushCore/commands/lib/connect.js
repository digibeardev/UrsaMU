const shajs = require("sha.js");

module.exports = mush => {
  mush.cmds.set("connect", {
    pattern: /^c[onnect]+\s+(.+)\s+(.+)/i,
    run: async (socket, match) => {
      const today = new Date();

      // pull the name and password from the regex match object.
      let [, name, password] = match;
      let dbRef;
      if (!socket._key) {
        // if the socket isn't logged in (no ID) then they can use this command/
        dbRef = await mush.db.get(name);
        dbRef = dbRef[0];
        password = mush.sha256(password);
        let authenticated = false;
        if (dbRef) {
          authenticated = password === dbRef.password ? true : false;
        }

        if (authenticated) {
          socket._key = dbRef._key;
          mush.db.update(dbRef._key, { modified: mush.moment().utc() });
          await mush.flags.set(dbRef, "connected");
          mush.queues.sockets.set(dbRef._key, socket);
          socket.timestamp = new Date().getTime() / 1000;
          mush.broadcast.send(
            socket,
            `%chLogin Successful%cn. Welcome to %chUrsaMU!%cn`
          );
          mush.exe(socket, "look", []);
          mush.emitter.emit("connected", socket);
        } else {
          mush.broadcast.send(
            socket,
            "Either that player does not exist, or " +
              "has a different password."
          );
          socket.attempts += 1;
          if (socket.attempts === 2) {
            socket.end();
          }
        }

        // Else they're already logged in.  Show a 'Huh?' message.
      } else {
        mush.broadcast.huh(socket);
      }
    }
  });
};
