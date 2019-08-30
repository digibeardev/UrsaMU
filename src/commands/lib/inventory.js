module.exports = mush => {
  mush.cmds.set("inventory", {
    pattern: /^(?:i|i[nventory]+)/i,
    restriction: "connected",
    run: socket => {
      const enactor = mush.db.id(socket.id);
      let output;
      if (enactor.contents.length <= 0) {
        output = "You aren't carrying anything.";
      } else {
        output = "You are carrying:";
      }

      enactor.contents
        .filter(item => item.type !== "exit")
        .forEach(item => {
          const name = (en, tar) => {
            // Make sure the enactor has permission to modify the target.
            // if so show dbref and flag codes, etc. Extra admin stuff.
            if (!tar.nameFormat) {
              if (mush.flags.canEdit(en, tar)) {
                return `${mush.name(en, tar)}`;
                // To do, add flag and object type codes later.
              } else {
                return `${tar.moniker ? tar.moniker : tar.name}`;
              }
            } else if (tar.nameFormat && en.location === tar.id) {
              return mush.parser.run(tar.nameFormat, {
                "%0": mush.name(en, tar)
              });
            } else {
              return mush.name(en, tar);
            }
          };

          output += `\n${name(enactor, mush.db.id(item))}`;
          if (
            enactor.contents.filter(item => item.type === "exit").length > 0
          ) {
            output += `Exits\n`;
            enactor.contents
              .filter(item => item.type === "exit")
              .forEach(item => {
                output += `${item.name}\n`;
              });
          }
        });
      mush.broadcast.send(socket, output);
    }
  });
};
