const { find } = require("lodash");
module.exports = mush => {
  // delcom
  // USAGE: delcom <alias>

  // Deletes an alias for a channel.  If it's the only
  // alias for the channel, then the channel is removed and
  // must be rejoined with addcom.
  mush.cmds.set("delcom", {
    pattern: /^delcom\s+(.*)/i,
    restriction: "connected",
    run: (socket, data) => {
      const enactor = mush.db.id(socket.id);
      const chan = find(enactor.channels, { alias: data[1] });
      if (chan) {
        // Get the index of the alias
        const index = enactor.channels.indexOf(chan);
        enactor.channels.splice(index, 1);
        mush.db.update(enactor.id, { channels: enactor.channels });
        mush.db.save();
        // Send a message letting them know the alias has been removed.
        mush.broadcast.send(
          socket,
          `%chDone%cn. Alias '%ch${chan.alias}%cn' removed from channel '%ch${
            chan.name
          }%cn'.`
        );
        const chanObj = mush.channels.get(chan.name);
        let found = false;
        // iterate through the channel list to see if there are any other
        // listings for the channel available.  If no alias left, inform
        // the channel has been removed completely.
        for (let channel of enactor.channels) {
          if (channel.name === chan.name) {
            found = true;
          }
        }

        // No matches found!
        if (!found) {
          mush.broadcast.send(
            socket,
            `You have no more aliases for channel '%ch${chan.name}%cn'.` +
              `  To rejoin you'll have to use %chaddcom%cn again.`
          );
          mush.emitter.emit(
            "channel",
            chanObj,
            `${enactor.name} has left this channel.`
          );
        }
      } else {
        mush.broadcast.send("I can't find that channel.");
      }
    }
  });
};
