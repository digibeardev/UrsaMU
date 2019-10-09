module.exports = parser => {
  parser.funs.set("lheader", async (en, args, scope) => {
    const string = await parser.evaluate(en, args[0], scope);
    return await parser.run(
      en,
      `%cr---%cn[ljust(%ch%cr<<%cn %ch${string} %cr>>%cn,75,%cr-%cn)]`,
      scope
    );
  });

  parser.funs.set("rheader", async (en, args, scope) => {
    const string = await parser.evaluate(en, args[0], scope);
    return await parser.run(
      en,
      `[rjust(%ch%cr<<%cn %ch${string} %cr>>%cn,75,%cr-%cn)]%cr---%cn`,
      scope
    );
  });

  parser.funs.set("header", async (en, args, scope) => {
    const string = await parser.evaluate(en, args[0], scope);
    return await parser.run(
      en,
      `[center(%ch%cr<<%cn %ch${string} %cr>>%cn,78,%cr-%cn)]`,
      scope
    );
  });

  parser.funs.set("divider", async (en, args, scope) => {
    const string = await parser.evaluate(en, args[0], scope);
    return await parser.run(
      en,
      `[center(%ch%cr<<%cn %ch${string} %cr>>%cn,78,%cr-%cn)]`,
      scope
    );
  });

  parser.funs.set("footer", async (en, args, scope) => {
    const string = await parser.evaluate(en, args[0], scope);
    if (args[0]) {
      return await parser.run(
        en,
        `[rjust(%ch%cr<<%cn %ch${string} %cr>>%cn,75,%cr-%cn)]%cr---%cn`,
        scope
      );
    } else {
      return await parser.run(en, `[repeat(%cr-%cn,78)]`, scope);
    }
  });
};
