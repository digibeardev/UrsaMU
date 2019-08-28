const { resolve } = require("path");
module.exports = mush => {
  mush.cmds.set("@reload", {
    pattern: /^@?reload\s+(.*)/i,
    restriction: "connected immortal|wizard|royalty",
    run: (socket, data) => {
      try {
        mush.flags.save();
        mush.db.save();
        mush.config.save();
        // delete the reference in the require cash
        delete require.cache[require.resolve(`./${data[1].trim()}.js`)];
        require(`./${data[1].trim()}`)(mush);
        mush.broadcast.send(
          socket,
          `%chDone%cn. Command "%ch${data[1]}%cn" reloaded.`
        );
      } catch (error) {
        mush.broadcast.send(
          socket,
          `Unable to reload module. ${error.message}`
        );
      }
    }
  });
};
