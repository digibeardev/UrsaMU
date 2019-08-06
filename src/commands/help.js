module.exports = mush => {
  mush.cmds.set("help", {
    pattern: /^\+?help/i,
    restriction: "connected",
    run: (socket, data) => {
      // get enactor info
    }
  });
};
