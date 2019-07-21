const fs = require("fs");
const path = require("path");

module.exports = mush => {
  const dir = fs.readdirSync(path.resolve(__dirname, "./lib/"));
  dir.forEach(file => {
    try {
      const txt = fs.readFileSync(
        path.resolve(__dirname, `./lib/${file}`),
        "utf-8"
      );
      mush.txt.set(file, txt);
    } catch (error) {
      if (error) throw error;
    }
  });
};
