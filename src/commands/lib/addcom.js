const { find } = require("lodash");

module.exports = mush => {
  // Command addcom
  // USAGE: addcom <alias>=<channel>
  // Join a channel where you have the proper permissions
  // to do so.
  mush.cmds.set("addcom", {
    pattern: /^addcom\s(\w+)\s?=s?(\w+)/i,
    restriction: "connected",
    run: (socket, data) => {
      const [, alias, channel] = data;
      const enactor = mush.db.id(socket.id);
      const chan = mush.channels.get(channel);
      const pchan = find(enactor.channels, { alias }); // Oink!
      // Check to see if the channel even exists first.
      if (chan) {
        if (!pchan) {
          // Check to see if they're allowed to join the channel first.
          if (mush.flags.orFlags(socket, chan.join) || !chan.join) {
            enactor.channels = [
              ...enactor.channels,
              { name: chan.name, alias, status: true, title: "" }
            ];
            mush.db.update(enactor.id, { channels: enactor.channels });
            mush.broadcast.send(
              socket,
              `%chDone.%cn Joined channel '%ch${chan.name}%cn' with alias '%ch${alias}%cn'.`
            );
            mush.emitter.emit(
              "channel",
              chan,
              `${enactor.name} has joined the channel.`
            );
          } else {
            mush.broadcast.send(socket, "Permission denied.");
          }
        } else {
          mush.broadcast.send(
            socket,
            `Alias '%ch${pchan.alias}%cn' is already asigned to channel '%ch${pchan.name}%cn'.`
          );
        }
      } else {
        mush.broadcast.send(socket, "That channel doesn't exist.");
      }
    }
  });

  mush.cmds.set("@clist", {
    pattern: /^@?clist\s+?(.*)/i,
    restriction: "connected",
    run: (socket, data) => {
      const enactor = mush.db.id(socket.id);
      let [, pattern] = data;
      let output = "Channels%r%r";
      output += "%cuName%cn".padEnd(20);
      output += "%cuOwner%cn".padEnd(20);
      output += "%cuHeader%cn".padEnd(20);
      output += "%cuDescription%cn";

      // build the channel information string.
      for (const channel of mush.channels.channels) {
        if (mush.flags.hasFlags(enactor, channel.join) || !channel.join) {
          output += `%r${channel.name}`.padEnd(16);
          output += channel.owner
            ? channel.owner.padEnd(14)
            : "None".padEnd(14);
          output += channel.header
            ? channel.header.padEnd(14)
            : "------".padEnd(14);
          output += channel.description
            ? channel.description.padEnd(16)
            : "No Description".padEnd(16);
        }
      }
      mush.broadcast.send(socket, output);
    }
  });
};
