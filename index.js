const UrsaMu = require("./src/ursamu");
const app = new UrsaMu({ plugins: "../plugins/mush-core/" });

console.log(app.db.add({ name: "Foobar" }));
