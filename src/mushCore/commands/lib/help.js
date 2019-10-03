module.exports = mush => {
  mush.cmds.set("help", {
    pattern: /^\+?help(\s.*)?/i,
    restriction: "connected",
    run: async (socket, data) => {
      let helpTxt =
        "%r%cr---%cn[ljust(%ch%cr<<%cn %chHELP %cr>>%cn,75,%cr-%cn)]";
      const enactor = await mush.db.key(socket._key);
      let help = data.filter(entry => entry !== "\r");
      let wizard = await mush.flags.hasFlags(
        enactor,
        "wizard|royalty|immortal"
      );
      if (!help[1]) {
        const categories = mush.help.categories.filter(cat => {
          if ((!wizard && cat === "Wizard") || cat === "Hidden") {
            return false;
          } else {
            return true;
          }
        });

        for (cat of categories) {
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
        helpTxt += `%r[footer(Type '+help <topic>' for more)]`;
        mush.broadcast.send(socket, helpTxt);
      } else {
        if (mush.help.has(help[1].trim())) {
          let helptext = `%cr---%cy[ljust(%ch%cr<<%cn %ch${help[1]
            .trim()
            .toUpperCase()} %cr>>%cn,75,%cr-%cn)]`;

          helptext += mush.help
            .get(help[1].trim())
            .text.replace(
              /(?:\*\*)(.*)(?:\*\*)/g,
              (...args) => `%ch${args[1]}%cn`
            )
            .replace(/`([^`]+)`/g, (...args) => `%cy${args[1]}%cn`)
            .replace(
              /\[([@?\w]+)\]\([^\)]+\)/g,
              (...args) => `${args[1].replace("@", " @")}`
            )
            .replace(/##\s(.*)/g, (...args) => `%ch%cu${args[1]}%cn`)
            .replace(/#\s(.*)/g, () => "");

          helptext += "%r[repeat(%cr-%cn,78)]";

          mush.broadcast.send(socket, helptext);
        } else {
          mush.broadcast.send(socket, "Huh? I don't have that help file.");
        }
      }
    }
  });
};
