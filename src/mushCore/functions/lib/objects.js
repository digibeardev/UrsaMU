module.exports = parser => {
  parser.funs.set("dbref", async (en, args) => {
    en = await parser.db.key(en);
    let tar = await parser.db.get(args[0]);
    tar = tar[0];
    if (tar) {
      return "#" + tar._key;
    } else {
      return "#-1 CAN'T FIND OBJECT";
    }
  });

  parser.funs.set("name", async (en, args) => {
    try {
      en = await parser.db.key(en);
      let tar = await parser.db.get(args[0]);

      if (Array.isArray(tar)) {
        tar = tar[0] || false;
      }

      if (tar) {
        if (await parser.flags.canEdit(en, tar)) {
          return `${
            tar.moniker ? tar.moniker : tar.name
          }${await parser.flags.flagCodes(tar)}`;
        } else {
          return `${tar.moniker ? tar.moniker : tar.name}`;
        }
      } else {
        return "#-1 CAN'T FIND OBJECT";
      }
    } catch (error) {
      parser.log.error(error);
    }
  });

  parser.funs.set("get", (en, args, scope) => {});
};
