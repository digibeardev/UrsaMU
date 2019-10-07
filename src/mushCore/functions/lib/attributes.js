module.exports = parser => {
  // default(<obj>, <attr>, <default string>)
  parser.funs.set("default", async (en, args, scope) => {
    const enactor = await parser.db.key(en);
    const curRoom = await parser.db.key(enactor.location);

    let tar = await parser
      .evaluate(en, args[0], scope)
      .catch(error => `#-1 ${error.toString().toUpperCase()}`);
    if (tar === "me") {
      tar = enactor;
    } else if (tar === "here") {
      tar = curRoom;
    } else {
      tar = await parser.db.key(tar);
      if (Array.isArray(tar)) {
        tar = tar[0];
      }
    }

    const attr = await parser
      .evaluate(en, args[1], scope)
      .catch(error => `#-2 ${error.toString().toUpperCase()}`);

    const def = await parser
      .evaluate(en, args[2], scope)
      .catch(error => `#-2 ${error.toString().toUpperCase()}`);

    if (parser.attrs.has(tar, attr)) {
      return await parser.attrs.get(tar, attr);
    } else {
      return def;
    }
  });
};
