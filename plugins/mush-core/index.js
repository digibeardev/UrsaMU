module.exports = app => {
  // Set the command parsing library
  app.parser = require("./lib/mushcode-parser");
  app.db = require("./lib/database");

  // load in-game functions
  require("./src/functions/")(app.parser);
  require("./src/mushcode-subs")(app.parser);

  // Load in-game commands
  require("./src/commands/")(app.parser);
};
