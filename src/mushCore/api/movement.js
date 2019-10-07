const { objData } = require("../database");
const broadcast = require("./broadcast");
const parser = require("./parser");
const { log } = require("../../utilities");
const emitter = require("./emitter");
module.exports.matchExit = async (obj, string) => {
  // Utility function to format my exits into regular expressions.
  const format = name => {
    const subs = name.replace(/;/g, "|^").replace(/^\r\n/i, "");
    return new RegExp(`(${subs})`, "i");
  };

  if (obj)
    // Loop through the different exits in the room, and return
    // the first to match.
    try {
      for (const exit of obj.exits) {
        // Check to see if the exit matches the input string If so
        // return the object for the exit.
        const ex = await objData.key(exit);
        if (string.match(format(parser.stripSubs(ex.name)))) {
          return exit;
        }
      }
    } catch (error) {
      log.error(error);
    }
};

module.exports.move = async (socket, eObj) => {
  const enactor = await objData.key(socket._key);
  // Update the enactor's current location.
  const curRoom = await objData.key(enactor.location);

  // Remove the enactor from the current room's contents list.
  broadcast.sendList(
    socket,
    curRoom.contents,
    `${enactor.moniker ? enactor.moniker : enactor.name} has left.`,
    "connected"
  );
  curRoom.contents.splice(curRoom.contents.indexOf(enactor._key), 1);
  objData.update(curRoom._key, { contents: curRoom.contents });

  // Add the enactor to the new location
  const tempExit = await objData.key(eObj);
  const newRoom = await objData.key(tempExit.to);
  await objData.update(enactor._key, { location: newRoom._key });
  await objData.update(newRoom._key, {
    contents: [...newRoom.contents, enactor._key]
  });
  emitter.emit("move", { socket, exit: eObj, newRoom });

  broadcast.sendList(
    socket,
    newRoom.contents,
    `${enactor.moniker ? enactor.moniker : enactor.name} has arrived.`,
    "connected"
  );
};
