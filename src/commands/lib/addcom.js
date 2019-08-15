module.exports = mush => {
  // Command addcom
  mush.cmds.set("addcom", {
    pattern: /^addcom\s(\w+)\s?=s?(\w+)/,
    restriction: "connected",
    run: (socket, data) => {
      const [, alias, channel] = data;
      const enactor = mush.db.id(socket.id);
      const chan = mush.channels.get(channel);

      // Check to see if they're allowed to join the channel first.
      if (mush.flags.orFlags(socket, chan.join) || !chan.join) {
        enactor.channels = [
          ...enactor.channels,
          { name: chan.name, alias, status: true, title: "" }
        ];
        mush.db.update(enactor.id, { channels: enactor.channels });
        mush.broadcast.send(
          socket,
          `%chDone.%cn Joined channel '%ch${
            chan.name
          }' with alias '%ch${alias}%cn'.`
        );
      } else {
        mush.broadcast.send(socket, "Permission denied.");
      }
    }
  });
};
