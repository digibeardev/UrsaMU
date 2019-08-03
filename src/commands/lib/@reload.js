module.exports = mush => {
  mush.cmds.set("@reload", {
    pattern: /^@?reload\s+(.*)/i,
    restriction: "connected admin",
    run: (socket, data) => {
      try {
        mush.flags.save();
        mush.db.save();
        mush.config.save();
        delete require.cache[require.resolve(`./${data[1]}.js`)];
        mush.broadcast.send(
          socket,
          `%chDone%cn. Command "%ch${data[1]}%cn" reloaded.`
        );
      } catch (error) {
        mush.broadcast.send(
          socket,
          `Unable to reload module.  Error: ${error.message}`
        );
      }
    }
  });
};
