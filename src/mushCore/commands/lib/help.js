module.exports = mush => {
  mush.cmds.set("help", {
    pattern: /^\+?help(\s.*)?/i,
    restriction: "connected",
    run: async (socket, data) => {
      let helpTxt =
        "%r%cr---%cn[ljust(%ch%cr<<%cn %chHELP %cr>>%cn,75,%cr-%cn)]";
      let help = data.filter(entry => entry !== "\r");
      if (!help[1]) {
        for (cat of mush.help.categories) {
          helpTxt += `%r[center(%ch%cr<<%cn %ch${cat.toUpperCase()} %cr>>%cn,78,%cr-%cn)]%r`;
          count = 0;
          mush.help
            .values()
            .filter(help => help.category === cat)
            .forEach(file => {
              if (count > 3) {
                helpTxt += "%r";
                count = 0;
              }
              helpTxt += file.name.padEnd(19);
              count++;
            });
        }
        helpTxt += `%r[rjust(%ch%cr<%cn %ch${
          mush.help.values().length
        }%cn entries %ch%cr>%cn,75,%cr-%cn )]%cr---%cn`;
        mush.broadcast.send(socket, helpTxt);
        if (
          await mush.flags.hasFlags(
            await mush.db.key(socket._key),
            "immortal|wizard|royalty"
          )
        ) {
          mush.broadcast.send(
            socket,
            "Type '%chhelp/admin%cn' for admin help commands."
          );
        }
      } else {
        if (mush.help.has(help[1].trim())) {
          let helptext = `%cr---%cy[ljust(%ch%cr<<%cn %ch${help[1]
            .trim()
            .toUpperCase()} %cr>>%cn,75,%cr-%cn)]`;

          helptext += mush.help
            .get(help[1].trim())
            .text.replace(
              /(?:\*\*)(.*)(?:\*\*)/,
              (...args) => `%ch${args[1]}%cn`
            )
            .replace(/`([^`]+)`/g, (...args) => `%cy${args[1]}%cn`)
            .replace(
              /\[([@?\w]+)\]\([^\)]+\)/g,
              (...args) => `${args[1].replace("@", " @")}`
            )
            .replace(/#\s(.*)/g, () => "");

          helptext += "%r[repeat(%cr-%cn,78)]";
          if (
            await mush.flags.hasFlags(
              await mush.db.key(socket._key),
              "wizard|royalty|immortal"
            )
          ) {
            helptext += "%rType '%chhelp/admin%cn' for admin help commands.";
          }

          mush.broadcast.send(socket, helptext);
        } else {
          mush.broadcast.send(socket, "Huh? I don't have that help file.");
        }
      }
    }
  });
};
