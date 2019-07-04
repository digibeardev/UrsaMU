const UrsaMu = require("./src/ursamu");

// Set up enviornmental variables for the dev project!
require("dotenv").config();

const mush = new UrsaMu({
  plugins: ["../plugins/mush-core/", "../plugins/telnet"]
});
