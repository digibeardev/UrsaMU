module.exports = mush => {
  mush.cmds.set("@link", {
    pattern: /^@?link\s+(.*)\s?=\s?(.*)/i,
    restriction: "connected immortal|wizard|royalty",
    run: async (socket, data) => {
      try {
        let [, obj, dbref] = data;

        const enactor = await mush.db.key(socket._key);
        const curRoom = await mush.db.key(enactor.location);

        // Check to see if obj is an exit in the room,
        // or some other type of db tracked object.
        const exit = await mush.grid.matchExit(curRoom, obj);
        if (exit) {
          obj = await mush.db.key(exit);
        } else if (obj === "me") {
          obj = enactor;
        } else {
          obj = await mush.db.get(obj);
        }

        // Trim any spaces from dbref.
        dbref = dbref.trim();

        // Set the dbref of the link location.
        if (dbref.toLowerCase() === "here") {
          dbref = curRoom._key;
        } else if (dbref.toLowerCase() === "me") {
          dbref = enactor._key;
        } else {
          // It's probably a dbref format #<number>.  Format it
          // to an integer.
          if (dbref[0] === "#") {
            dbref = dbref.slice(1);
          }
        }

        if (obj.type === "thing" || "player") {
          const location = await mush.db.key(dbref);
          await mush.db.update(obj._key, { home: dbref });
          mush.broadcast.send(
            socket,
            `%chDone%cn. ${obj.type.charAt(0).toUpperCase()}${obj.type.slice(
              1
            )} '%ch${obj.name}%cn' linked to '%ch${location.name}%cn'.`
          );
        } else if (obj.type === "exit") {
          const room = mush.db.Key(dbref);
          await mush.db.update(obj._key, { to: dbref });
          mush.broadcast.send(
            socket,
            `%chDone%cn. Exit '%ch${
              obj.name.split(";")[0]
            }%cn' linked to room '%ch${room.name}%cn'.`
          );
        } else {
          await mush.db.update(obj.id, { dropTo: dbref });
        }
      } catch (error) {
        mush.log.error(error);
      }
    }
  });
};
