module.exports = mush => {
  mush.cmds.set("@teleport", {
    pattern: /^@te[leport]+\s+(.*)\s?=\s?(.*)/i,
    restriction: "connected immortal|wizard|royalty",
    run: async (socket, data) => {
      try {
        let [, obj, dest] = data;
        // get enactor and current room data.
        const enactor = await mush.db.key(socket._key);
        const curRoom = await mush.db.key(enactor.location);

        // Check to see what kind of input we recieved for object.
        if (obj[0] === "#") {
          obj = await mush.db.kry(obj.slice(1));
          // Check to see if it's a dbref instead
        } else if (Number.isInteger(parseInt(obj))) {
          obj = mush.db.keu(obj);
          // Are they referencing themselves?
        } else if (obj.toLowerCase() === "me") {
          obj = await mush.db.key(enactor._key);
        }

        // Determine destination
        if (dest.toLowerCase() === "here") {
          // Where is the object going?
          dest = await mush.db.key(enactor.location);
        } else if (dest.toLowerCase() === "me") {
          dest = enactor;
        } else if (dest.toLowerCase() === "home") {
          // If we're sending it home, make sure it has one, else dump it back in
          // the start room!
          dest = obj.home || mush.config.get("startingRoom");
        } else {
          // Does the dbref start with a '#'?
          if (dest[0] === "#") {
            dest = mush.db.key(dest.slice(1));
          } else if (Number.isInteger(parseInt(dest))) {
            dest = mush.db.key(dest);
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
        curRoom.contents.splice(curRoom.contents.indexOf(obj._key), 1);
        await mush.db.update(curRoom._key, { contents: curRoom.contents });
        await mush.db.update(obj._key, { location: dest._key });

        // Put the object in the new enviornment.
        dest.contents = [...dest.contents, obj._key];
        await mush.db.update(dest._key, { contents: dest.contents });
        obj.location = dest._key;
        await mush.db.update(obj._key, { location: dest._key });
        mush.broadcast.sendList(
          dest.contents,
          `${obj.name} shimmers and teleports in.`,
          "connected"
        );
        mush.exe(socket, "look");
      } catch (error) {
        mush.log.error(error);
      }
    }
  });
};
