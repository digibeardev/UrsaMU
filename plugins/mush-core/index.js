module.exports = mush => {
  // Modify the base server object with our MUSH specific arguments.
  mush.parser = require("./lib/mushcode-parser"); // Load the command parser
  //Set our connections container
  mush.parser.sockets = new Set();
  // Load Parser modules.
  require("./lib/functions/")(mush.parser); // Load parser functions.
  require("./lib/mushcode-subs")(mush.parser); // Load the substitution '%' module.
  require("./lib/commands/")(mush.parser); // In-game commands.

  mush.parser.db = require("./lib/database"); // Database code.
  mush.flags = require("./lib/flags"); // Load the flags system.
  mush.types = new Set("player", "exit", "thing"); // Set the default types.
};
