const UrsaMu = require("./src/ursamu");

// Set up enviornmental variables for the dev project!
require("dotenv").config();

const app = new UrsaMu({
  // plugins: ["../plugins/mush-core/", "../plugins/telnet"]
  plugins: "../plugins/mush-core/"
});

app.db.update({ name: "test1" });
app.db.update({ name: "Test2" });
console.log(app.db.name("FooBaz Test2"));
