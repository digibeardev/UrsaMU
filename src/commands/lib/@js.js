module.exports = mush => {
  const vm = new mush.VM({
    sandbox: { mush }
  });

  mush.cmds.set("@js", {
    pattern: /^@js\s+(.*)/i,
    restriction: "connected immortal|wizard|royalty|coder",
    run: (socket, data) => {
      return socket.write(vm.run(data[1]) + "\r\n");
    }
  });
};
