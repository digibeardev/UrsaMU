module.exports = mush => {
  mush.cmds.set("look", {
    pattern: /^[look]+\s+?(.*)?/i,
    restriction: "connected",
    run: (socket, match) => {
      // Set a couple of function expressions to help build
      // object descriptions.

      const name = (en, tar) => {
        // Make sure the enactor has permission to modify the target.
        // if so show dbref and flag codes, etc. Extra admin stuff.
        if (!tar.nameFormat) {
          if (mush.flags.canEdit(en, tar)) {
            return `${tar.moniker ? tar.moniker : tar.name}(#${tar.id})`;
            // To do, add flag and object type codes later.
          } else {
            return `${tar.moniker ? tar.moniker : tar.name}`;
          }
        } else if (tar.nameFormat && en.location === tar.id) {
          return mush.parser.run(tar.nameFormat, {
            "%0": mush.flags.canEdit(en, tar)
              ? tar.name + `(#${tar.id})`
              : tar.name
          });
        } else {
          return tar.moniker ? tar.moniker : tar.name;
        }
      };

      const description = (en, tar) => {
        if (tar.hasOwnProperty("descformat")) {
          return mush.parser.run(tar.descformat, { "%1": tar.description });
        } else {
          return tar.description;
        }
      };

      // Format contents for display
      const contents = (en, tar) => {
        let cont = target.type === "player" ? "\nCarrying:" : "\nContents:";
        if (tar.hasOwnProperty("conformat")) {
          return mush.parser.run(tar.conformat, {
            "%0": tar.contents.map(item => "#" + item).join(),
            "%1": tar.contents.map(item => item.name).join()
          });
        } else {
          tar.contents.forEach(item => {
            const obj = mush.db.id(item);
            if (
              (obj.type === "player" &&
                mush.flags.hasFlags(obj, "connected")) ||
              obj.type !== "player"
            ) {
              console.log(mush.flags.hasFlags(obj, "connected"));
              cont += `\n${name(en, obj)}`;
            }
          });
        }
        return cont;
      };

      // Format exits for display.
      const exits = (en, tar) => {
        let exits = "\nExits:";
        if (tar.hasOwnProperty("exitformat")) {
          return mush.parser.run(tar.exitformat, {
            "%0": tar.exits.map(exit => " #" + exit).join()
          });
        } else if (tar.exits > 0) {
          // Format each exit before adding it to the display string.
          for (let exit of tar.exits) {
            exits += "\n" + mush.db.id(exit).name.split(";")[0];
          }
          return exits;
        } else {
          return "";
        }
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
        desc += description(enactor, target);
        if (target.contents.length > 0) {
          desc += contents(enactor, target);
        }
        desc += exits(enactor, target);
        mush.broadcast.send(socket, desc);
      }
    }
  });
};
