const db = require("./database");
const broadcast = require("./broadcast");

module.exports.matchExit = (obj, string) => {
  // Utility function to format my exits into regular expressions.
  const format = name => {
    const subs = name.replace(/;/g, "|");
    return new RegExp(`(${subs})`, "i");
  };

  if (obj)
    // Loop through the different exits in the room, and return
    // the first to match.
    for (const exit of obj.exits) {
      // Pull a database record for the exit since only IDs of
      // exits are stored.
      const eObj = db.id(exit);

      // Check to see if the exit matches the input string If so
      // return the object for the exit.
      if (string.match(format(eObj.name))) {
        return eObj;
      }
    }
};

module.exports.move = (enactor, eObj) => {
  // Update the enactor's current location.
  const curRoom = db.id(enactor.location);

  // Remove the enactor from the current room's contents list.
  broadcast.sendList(
    curRoom.contents,
    `${enactor.name} has left.`,
    "connected"
  );
  curRoom.contents.splice(curRoom.contents.indexOf(enactor.id), 1);
  db.update(curRoom.id, { contents: curRoom.contents });

  // Add the enactor to the new location
  const newRoom = db.id(eObj.to);
  db.update(enactor.id, { location: newRoom.id });
  db.update(newRoom.id, { contents: [...newRoom.contents, enactor.id] });
  broadcast.sendList(
    newRoom.contents,
    `${enactor.name} has arrived.`,
    "connected"
  );
  db.save();
};
