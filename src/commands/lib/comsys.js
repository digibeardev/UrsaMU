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
              `%chDone.%cn Joined channel '%ch${
                chan.name
              }%cn' with alias '%ch${alias}%cn'.`
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
            `Alias '%ch${pchan.alias}%cn' is already asigned to channel '%ch${
              pchan.name
            }%cn'.`
          );
        }
      } else {
        mush.broadcast.send(socket, "That channel doesn't exist.");
      }
    }
  });

  // Command: @clist
  // Usage: @clist [<pattern>]
  // List the channels the enactor is eligable to
  // join. Pattern filters the selection.
  mush.cmds.set("@clist", {
    pattern: /^@?clist\s+?(.*)/i,
    restriction: "connected",
    run: (socket, data) => {
      const enactor = mush.db.id(socket.id);
      let pattern = data[1];
      let output = "Channels%r%r";
      output += "%cuName%cn".padEnd(20);
      output += "%cuOwner%cn".padEnd(20);
      output += "%cuHeader%cn".padEnd(20);
      output += "%cuDescription%cn";

      // build the channel information string.
      channels = mush.channels.channels.filter(channel => {
        if (
          pattern.toLowerCase() &&
          channel.name.toLowerCase().match(pattern, "i")
        ) {
          return channel;
        } else if (!pattern) {
          return channel;
        }
      });
      for (const channel of channels) {
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
        mush.broadcast.send(socket, "I can't find that channel.");
      }
    }
  });

  // Command: Comtitle
  // Usage: comtitle <alias>=<title>
  // Set a title on a com channel that you have permission to
  // join.
  mush.cmds.set("comtitle", {
    pattern: /^comtitle\s+(.*)\s?=\s?(.*)?/i,
    restriction: "connected",
    run: (socket, data) => {
      const [, alias, title = ""] = data;
      const enactor = mush.db.id(socket.id);
      const channel = find(enactor.channels, { alias });

      // Make sure the channel alias actually exists
      if (channel) {
        channel.title = title.trim();
        const index = enactor.channels.indexOf(channel);
        enactor.channels.splice(index, 1);
        enactor.channels.push(channel);
        mush.db.update(enactor.id, { channels: enactor.channels });

        // If the title exists, add it - else remove it from the channel
        // entry.
        if (title) {
          mush.broadcast.send(
            socket,
            `%chDone.%cn channel '%ch${channel.name}%cn' title set to '%ch${
              channel.title
            }%cn'.`
          );
          // Title removed.
        } else {
          mush.broadcast.send(
            socket,
            `%chDone%cn. title removed from channel '%ch${channel.name}%cn'.`
          );
        }
      } else {
        mush.broadcast.send(socket, "Unknown alias.");
      }
    }
  });
};
