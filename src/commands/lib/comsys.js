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
        if (mush.flags.hasFlags(enactor, channel.see) || !channel.see) {
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

  mush.cmds.set("@cboot", {
    pattern: /^@?cboot\s+(\w+)\s?=\s?(.*)/i,
    restriction: "connected",
    run: (socket, data) => {
      const enactor = mush.db.id(socket.id);
      const target = mush.db.id(data[2]);
      if (target) {
        const chan = mush.find(target.channels, { name: data[1] });
        const channel = mush.channels.get(data[1]);
        if (
          channel &&
          mush.flags.hasFlags(enactor, channel.mod) &&
          chan.status
        ) {
          mush.emitter.emit(
            "channel",
            channel,
            `${enactor.name} boots ${target.name} from the channel.`
          );

          // Update the channels entry on the target.
          mush.emitter.emit(
            "channel",
            channel,
            `${target.name} has left the channel.`
          );
          let index = target.channels.indexOf(chan);
          target.channels.splice(index, 1);
          chan.status = false;
          target.channels.push(chan);
          mush.db.update(target.id, { channels: target.channels });
          mush.db.save();
        } else {
          if (!chan.status) {
            mush.broadcast.send(
              socket,
              `${enactor.name} isn't on that channel.`
            );
          } else {
            mush.broadcast.send(socket, "Permission denied.");
          }
        }
      } else {
        mush.broadcast.send(socket, "I can't find that player.");
      }
    }
  });

  // @ccreate
  // Use: @ccreate <channel>
  // Create a new channel and add it to the comsys.
  mush.cmds.set("@ccreate", {
    pattern: /^@?ccreate\s+?(\w+)/i,
    restriction: "connected immortal|wizard|royalty",
    run: (socket, data) => {
      enactor = mush.db.id(socket.id);
      if (mush.channels.get(data[1])) {
        mush.broadcast.send(socket, "That channel already exists.");
      } else {
        mush.channels.channels.push({
          name: data[1],
          see: "",
          join: "",
          talk: "",
          mod: "immortal|wizard|royalty",
          owner: enactor.id,
          header: ""
        });
        mush.channels.save();
        mush.broadcast.send(
          socket,
          `%chDone.%cn Channel '%ch${data[1]}%cn' added.`
        );
      }
    }
  });

  mush.cmds.set("@cdestroy", {
    pattern: /^@?cdestroy\s+?(\w+)/i,
    restriction: "connected immortal|wizard",
    run: (socket, data) => {
      const enactor = mush.db.id(socket.id);
      const channel = mush.channels.get(data[1]);
      if (channel) {
        const index = mush.channels.channels.indexOf(channel);
        mush.channels.channels.splice(index, 1);
        mush.channels.save();
        mush.broadcast.send(
          socket,
          `%chDone%cn. Channel '%ch${channel.name}%cn' destroyed.`
        );
      } else {
        mush.broadcast.send(socket, "I can't find that channel.");
      }
    }
  });
};
