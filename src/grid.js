const db = require("./database");
const parser = require("./parser");

class Grid {
  constructor() {}

  /**
   * Match a string to a list of the object's exits.
   * @param {Object} obj The object we want to evaluate exits on
   * @param {String} string The string to match.
   * @returns {Object} The Database Object of the desired exit.
   */
  matchExit(obj, string) {
    // Utility function to format my exits into regular expressions.
    const format = name => {
      const subs = name.replace(/;/g, "|^").replace(/^\r\n/i, "");
      return new RegExp(`(${subs})`, "i");
    };

    // Loop through the different exits in the room, and return
    // the first to match.
    for (const exit of obj.exits) {
      // Check to see if the exit matches the input string If so
      // return the object for the exit.
      if (string.match(format(parser.stripSubs(db.id(exit).name)))) {
        return exit;
      }
    }
  }
}

module.exports = new Grid();
