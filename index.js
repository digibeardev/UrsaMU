const UrsaMu = require("./src/ursamu");
const app = new UrsaMu({ plugins: "../plugins/mush-core/" });
console.log(app.parser.help.get("ljust").entry.trim());
app.parser.help.save();
