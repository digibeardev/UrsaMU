module.exports = parser => {
  parser.funs.set("lheader", async (en, args, scope) => {
    return await parser.run(
      en,
      `%cr---%cn[ljust(%ch%cr<<%cn %ch${args[0]} %cr>>%cn,75,%cr-%cn)]`,
      scope
    );
  });

  parser.funs.set("rheader", async (en, args, scope) => {
    return await parser.run(
      en,
      `[rjust(%ch%cr<<%cn %ch${args[0]} %cr>>%cn,75,%cr-%cn)]%cr---%cn`,
      scope
    );
  });

  parser.funs.set("header", async (en, args, scope) => {
    return await parser.run(
      en,
      `[center(%ch%cr<<%cn %ch${args[0]} %cr>>%cn,78,%cr-%cn)]`,
      scope
    );
  });

  parser.funs.set("divider", async (en, args, scope) => {
    return await parser.run(
      en,
      `[center(%ch%cr<<%cn %ch${args[0]} %cr>>%cn,78,%cr-%cn)]`,
      scope
    );
  });

  parser.funs.set("rfooter", async (en, args, scope) => {
    return await parser.run(
      en,
      `[rjust(%ch%cr<<%cn %ch${args[0]} %cr>>%cn,75,%cr-%cn)]%cr---%cn`,
      scope
    );
  });

  parser.funs.set("lfooter", async (en, args, scope) => {
    return await parser.run(
      en,
      `%cr---%cn[ljust(%ch%cr<<%cn %ch${args[0]} %cr>>%cn,75,%cr-%cn)]`,
      scope
    );
  });

  parser.funs.set("footer", async (en, args, scope) => {
    return await parser.run(en, `[repeat(%cr-%cn,78)]`, scope);
  });
};
