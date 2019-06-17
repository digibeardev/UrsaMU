module.exports = app => {
  app.parser = require("./src/mushcode-parser");
  require("./src/functions/")(app.parser);
  require("./src/mushcode-subs")(app.parser);
  require("./src/commands/mushcode-cmd-help")(app.parser);
};
