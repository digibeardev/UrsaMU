module.exports = mush => {
  mush.cmds.set("help", {
    pattern: /^\+?help(\s+.*)?/i,
    restriction: "connected",
    run: (socket, data) => {
      let helpTxt =
        "%r%cr---%cn[ljust(%ch%cr<<%cn %chHELP %cr>>%cn,75,%cr-%cn)]";
      if (!data[1]) {
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
      } else {
        if (mush.help.has(data[1].trim())) {
          helpTxt =
            "%r%cr---%cn[ljust(%ch%cr<<%cn %chHELP %cr>>%cn,75,%cr-%cn)]%r" +
            `${mush.help.get(data[1].trim()).text}%r` +
            "[repeat(%cr-%cn,78)]";
          mush.broadcast.send(socket, helpTxt);
        } else {
          mush.broadcast.send(socket, "Huh? I can't find that help file.");
        }
      }
    }
  });
};
