module.exports = mush => {
  mush.cmds.set("@link", {
    pattern: /^@?link\s+(.*)\s?=\s?(.*)/i,
    restriction: "connected immortal|wizard|royalty",
    run: (socket, data) => {
      let [, obj, dbref] = data;

      const enactor = mush.db.id(socket.id);
      const curRoom = mush.db.id(enactor.location);

      // Check to see if obj is an exit in the room,
      // or some other type of db tracked object.
      const exit = mush.grid.matchExit(curRoom, obj);
      if (exit) {
        obj = mush.db.id(exit);
      } else if (obj === "me") {
        obj = enactor;
      } else {
        obj = mush.db.find({ name: obj });
      }

      // Trim any spaces from dbref.
      dbref = dbref.trim();

      // Set the dbref of the link location.
      if (dbref.toLowerCase() === "here") {
        dbref = curRoom.id;
      } else if (dbref.toLowerCase() === "me") {
        dbref = enactor.id;
      } else {
        // It's probably a dbref format #<number>.  Format it
        // to an integer.
        if (dbref[0] === "#") {
          dbref = parseInt(dbref.slice(1));
        } else {
          dbref = parseInt(dbref);
        }
      }

      if (obj.type === "thing" || "player") {
        const location = mush.db.id(dbref);
        mush.db.update(obj.id, { home: dbref });
        mush.broadcast.send(
          socket,
          `%chDone%cn. ${obj.type.charAt(0).toUpperCase()}${obj.type.slice(
            1
          )} '%ch${obj.name}%cn' linked to '%ch${location.name}%cn'.`
        );
      } else if (obj.type === "exit") {
        const room = mush.db.id(dbref);
        mush.db.update(obj.id, { to: dbref });
        mush.broadcast.send(
          socket,
          `%chDone%cn. Exit '%ch${
            obj.name.split(";")[0]
          }%cn' linked to room '%ch${room.name}%cn'.`
        );
      } else {
        mush.db.update(obj.id, { dropTo: dbref });
      }
      mush.db.save();
    }
  });
};
