const fs = require("fs");
const path = require("path");

module.exports = mush => {
  dir = fs.readdirSync(path.resolve(__dirname, "./lib/"));
  dir.forEach(file => {
    require(path.resolve(__dirname, "./lib/", file))(mush);
  });
};
