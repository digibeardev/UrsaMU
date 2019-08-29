moment = require("moment");

module.exports = mush => {
  mush.cmds.set("look", {
    pattern: /^[look]+\s+?(.*)?/i,
    restriction: "connected",
    run: (socket, match) => {
      // Set a couple of function expressions to help build
      // object descriptions.

      const name = (en, tar, override = false) => {
        // Make sure the enactor has permission to modify the target.
        // if so show dbref and flag codes, etc. Extra admin stuff.
        const objName = mush.flags.canEdit(en, tar)
          ? `${tar.name}\(#${tar.id}\)`
          : tar.name;

        return en.location === tar.id && !override
          ? `[center(%ch%cr<<%cn %ch%0 %cr>>%cn,78,%cr-%cn)]`
          : objName;
      };

      const description = (en, tar) => {
        return tar.description;
      };

      const idleTime = player => {
        const idleEpoch = mush.queues.idToSocket(player).timestamp;
        let d = new Date(0);
        d.setUTCSeconds(idleEpoch);
        const idle = moment(d.toUTCString());
        const now = moment(Date.now());
        return idle.from(now, true);
      };

      // Format contents for display
      const contents = (en, tar) => {
        const players = tar.contents.filter(
          obj =>
            mush.db.id(obj).type === "player" &&
            mush.flags.hasFlags(mush.db.id(obj), "connected")
        );
        const objects = tar.contents.filter(
          obj => mush.db.id(obj).type === "thing"
        );
        let output = "";

        if (en.location === tar.id) {
          output =
            "%cr---%cn[ljust(%ch%cr<<%cn %chCharacters %cr>>%cn,75,%cr-%cn)]" +
            "[ljust(%r%ch%cuName%cn,20)][ljust(%ch%cuIdle%cn,15)]%cn %ch%cuShort-Desc%cn";
          for (const player of players) {
            output += `%r${name(en, mush.db.id(player))}`.padEnd(21);
            output += `${idleTime(player)}`.padEnd(16);
            output += `${
              mush.attrs.get(mush.db.id(player), "short-desc")
                ? mush.attrs.get(mush.db.id(player), "short-desc").value
                : "%ch%cxType %cn&short-desc me=<desc>%ch%cx to set.%cn"
            }`;
          }
          if (objects.length > 0) {
            output +=
              "%r%cr---%cn[ljust(%ch%cr<<%cn %chObjects %cr>>%cn,75,%cr-%cn)]";
            for (obj of objects) {
              output += `%r${name(en, mush.db.id(obj))}`;
            }
          }
        } else {
          output = tar.type === "player" ? "\nCarrying:" : "\nContents:";
          tar.contents.forEach(
            item => (output += `%r${name(en, mush.db.id(item))}`)
          );
        }

        return output;
      };
      let tars;
      // Format exits for display.
      const exits = (en, tar) => {
        let output = "";
        if (tar.exits.length > 0) {
          tars =
            `%r%cr---%cn[ljust(%ch%cr<<%cn %chExits %cr>>%cn,75,%cr-%cn)]%r` +
            `[columns(${tar.exits
              .map(exit =>
                mush.db
                  .id(exit)
                  .name.split(";")[0]
                  .trim()
              )
              .join("|")},26,|)]`;
        }
        return tars;
      };

      // Figure out enactor and target information.
      let enactor, target;
      enactor = mush.db.id(socket.id);
      target = match[1];

      if (!target) {
        target = enactor.location;
      }

      // if target is a number, it's probably a dbref so we'll
      // just check for it right away.
      if (Number.isInteger(target)) {
        target = mush.db.id(target);
        // Else we're dealing with a name, or a special case like 'here'
        // or 'me', or an actual name.
      } else {
        // Get the DBO of the target.
        if (target.toLowerCase() === "me") {
          target = enactor;
        } else if (target.toLowerCase() == "here") {
          target = mush.db.id(enactor.location);
        } else if (mush.db.name(target)) {
          target = mush.db.name(target);
        } else {
          target = false;
        }
      }

      // If target doesn't have a value at this point, the object probably
      // doesn't exist.
      if (!target) {
        mush.broadcast.send(socket, "I can't find that here.");
      } else {
        let desc = "";
        // Send the built description to the enactor.
        desc += name(enactor, target) + "\n";
        desc += "%r%t" + description(enactor, target) + "%r%r";
        if (target.contents.length > 0) {
          desc += contents(enactor, target);
        }
        if (exits(enactor, target)) {
          desc += exits(enactor, target);
        }
        if (enactor.location === target.id) {
          desc += `%r[rjust(%ch%cr<<%cn %ch${
            mush.flags.hasFlags(target, "ic") ? "IC" : "OOC"
          } %cr>>%cn,75,%cr-%cn)]%cr---%cn`;
        }
        mush.broadcast.send(
          socket,
          mush.parser.run(desc, { "%0": name(enactor, target, true) })
        );
      }
    }
  });
};
