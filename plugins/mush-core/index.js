module.exports = app => {
  // Modify the base server object with our MUSH
  // specific arguments.
  app.parser = require("./lib/mushcode-parser"); // Load the command parser
  // Load Parser modules.
  require("./lib/functions/")(app.parser); // Load parser functions.
  require("./lib/mushcode-subs")(app.parser); // Load the substitution '%' module.
  require("./lib/commands/")(app.parser); // In-game commands.

  app.parser.db = require("./lib/database"); // Database code.
  app.flags = require("./lib/flags"); // Load the flags system.
  app.types = new Set("player", "exit", "thing"); // Set the default types.
};
