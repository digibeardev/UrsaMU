module.exports = mush => {
  mush.cmds.set("@teleport", {
    pattern: /^@te[leport]+\s+(.*)\s?=\s?(.*)/i,
    restriction: "connected immortal|wizard|royalty",
    run: (socket, data) => {
      let [, obj, dest] = data;
      // get enactor and current room data.
      const enactor = mush.db.id(socket.id);
      const curRoom = mush.db.id(enactor.location);

      // Check to see what kind of input we recieved for object.
      if (obj[0] === "#") {
        obj = mush.db.id(parseInt(obj.slice(1)));
        // Check to see if it's a dbref instead
      } else if (Number.isInteger(parseInt(obj))) {
        obj = mush.db.id(parseInt(obj));
        // Are they referencing themselves?
      } else if (obj.toLowerCase() === "me") {
        obj = mush.db.id(enactor.id);
      }

      // Determine destination
      if (dest.toLowerCase() === "here") {
        // Where is the object going?
        dest = mush.db.id(enactor.location);
      } else if (dest.toLowerCase() === "me") {
        dest = enactor;
      } else if (dest.toLowerCase() === "home") {
        // If we're sending it home, make sure it has one, else dump it back in
        // the start room!
        dest = obj.home || mush.config.startingRoom;
      } else {
        // Does the dbref start with a '#'?
        if (dest[0] === "#") {
          dest = mush.db.id(parseInt(dest.slice(1)));
        } else if (Number.isInteger(parseInt(dest))) {
          dest = mush.db.id(parseInt(dest));
          // Else IDK WTF to do with it.
        } else {
          return mush.broadcast.send(socket, "I can't find that.");
        }
      }

      // remove the object from it's current location/person
      mush.broadcast.sendList(
        curRoom.contents,
        `${obj.name} shimmers and teleports out.`,
        "connected"
      );
      curRoom.contents.splice(curRoom.contents.indexOf(obj.id), 1);
      mush.db.update(curRoom.id, { contents: curRoom.contents });
      mush.db.update(obj.id, { location: dest.id });

      // Put the object in the new enviornment.
      dest.contents = [...dest.contents, obj.id];
      mush.db.update(dest.id, { contents: dest.contents });
      obj.location = dest.id;
      mush.db.update(obj.id, { location: dest.id });
      mush.broadcast.sendList(
        dest.contents,
        `${obj.name} shimmers and teleports in.`,
        "connected"
      );
      mush.exe(socket, "look", ["here"]);
      mush.db.save();
    }
  });
};
