const UrsaMu = require("./src/ursamu");
const { mapToJson, jsonToMap } = require("./src/utilities");
const app = new UrsaMu({ plugins: "../plugins/mush-core/" });

console.log(app.db.name("FooBaz"));
