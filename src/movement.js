const db = require("./database");
const broadcast = require("./broadcast");
const parser = require("./parser");

module.exports.matchExit = (obj, string) => {
  // Utility function to format my exits into regular expressions.
  const format = name => {
    const subs = name.replace(/;/g, "|^").replace(/^\r\n/i, "");
    return new RegExp(`(${subs})`, "i");
  };

  if (obj)
    // Loop through the different exits in the room, and return
    // the first to match.
    for (const exit of obj.exits) {
      // Check to see if the exit matches the input string If so
      // return the object for the exit.
      if (string.match(format(parser.stripSubs(db.id(exit).name)))) {
        return exit;
      }
    }
};

module.exports.move = (socket, eObj) => {
  const enactor = db.id(socket.id);
  // Update the enactor's current location.
  const curRoom = db.id(enactor.location);

  // Remove the enactor from the current room's contents list.
  broadcast.sendList(
    socket,
    curRoom.contents,
    `${enactor.name} has left.`,
    "connected"
  );
  curRoom.contents.splice(curRoom.contents.indexOf(enactor.id), 1);
  db.update(curRoom.id, { contents: curRoom.contents });

  // Add the enactor to the new location
  const newRoom = db.id(db.id(eObj).to);
  db.update(enactor.id, { location: newRoom.id });
  db.update(newRoom.id, { contents: [...newRoom.contents, enactor.id] });
  broadcast.sendList(
    socket,
    newRoom.contents,
    `${enactor.name} has arrived.`,
    "connected"
  );
  db.save();
};
