const helpFile = new require("./lib/help");

module.exports = mush => {
  // Modify the base server object with our MUSH specific arguments.
  mush.parser = require("./lib/mushcode-parser"); // Load the command parser
  mush.flags = require("./lib/flags"); // Load the flags system.
  mush.db = require("./lib/database"); // Database code.
  mush.grid = require("./lib/grid"); // grid building API.
  mush.help = helpFile;
  //Set our connections container
  mush.sockets = new Set();
  // Load Parser modules.
  require("./lib/functions/")(mush); // Load parser functions.
  require("./lib/mushcode-subs")(mush); // Load the substitution '%' module.
  require("./lib/commands/")(mush); // In-game commands.
};
