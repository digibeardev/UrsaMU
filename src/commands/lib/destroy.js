module.exports = mush => {
  mush.cmds.set("@destroy", {
    pattern: /^@?destroy\s+(.*)/i,
    restriction: "connected admin",
    run: (socket, data) => {}
  });
};
