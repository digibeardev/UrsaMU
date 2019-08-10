module.exports = mush => {
  mush.cmds.set("help", {
    pattern: /^\+?help(\s+.*)?/i,
    restriction: "connected",
    run: (socket, data) => {
      let helpTxt =
        "%r%cr---%cn[ljust(%ch%cr<<%cn %chHELP %cr>>%cn,75,%cr-%cn)]";

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
    }
  });
};
