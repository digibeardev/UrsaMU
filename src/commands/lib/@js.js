module.exports = mush => {
  const vm = new mush.VM({
    sandbox: { db: mush.db }
  });

  mush.cmds.set("@js", {
    pattern: /^@js\s+(.*)/i,
    restriction: "connected admin",
    run: (socket, data) => {
      return socket.write(vm.run(data[1]) + "\r\n");
    }
  });
};
