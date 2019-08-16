module.exports = mush => {
  mush.cmds.set("@destroy", {
    pattern: /^@?destroy\s+(.*)/i,
    restriction: "connected immortal|wizard|royalty",
    run: (socket, data) => {}
  });
};
