module.exports = mush => {
  mush.cmds.set("@restart", {
    pattern: /^@restart/,
    restriction: "connected wizard|immortal",
    run: async (socket, data) => {
      const enactor = await mush.db.key(socket._key);
      mush.restart(enactor);
    }
  });
};
