module.exports = mush => {
  mush.cmds.set("help", {
    pattern: /^\+?help/i,
    restriction: "connected",
    run: (socket, data) => {
      mush.broadcast.send(
        socket,
        "[center(%ch%cr<<%cn %chHELP %cr>>%cn,78,%cr-%cn)]%r%rType '%chhelp" +
          " <topic>%cn' for more help."
      );
    }
  });
};
