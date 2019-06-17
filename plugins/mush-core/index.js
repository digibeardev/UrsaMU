module.exports = app => {
  console.log(app);
  app.parser = require("./src/mushcode-parser")(app);

  require("./src/functions/")(app.parser);
  require("./src/mushcode-subs")(app.parser);
  require("./src/commands/mushcode-cmd-help")(app.parser);
};
