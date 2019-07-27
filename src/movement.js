const db = require("./database");

module.exports.matchExit = (obj, string) => {
  // Utility function to format my exits into regular expressions.

  const format = name => {
    const subs = name.replace(/;/g, "|");
    return new Regexp(`(${subs})`, "i");
  };

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

module.exports.move = (enactor, eObj) => {};
