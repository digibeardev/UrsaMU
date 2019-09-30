const fs = require("fs");
const path = require("path");

module.exports = mush => {
  const dir = fs.readdirSync(path.resolve(__dirname, "./lib/"));
  dir.forEach(file => {
    require(path.resolve(__dirname, "./lib/", file))(mush);
  });

  return {
    restart: () => {
      const dir = fs.readdirSync(path.resolve(__dirname, "./lib/"));
      dir.forEach(file => {
        delete require.cache[require.resolve(`./lib/${file}`)];
        require(path.resolve(path.resolve(__dirname, "./lib/"), file))(mush);
      });
    }
  };
};
