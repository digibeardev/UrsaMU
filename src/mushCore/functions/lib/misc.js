module.exports = mush => {
  // Misc functions

  // Set a variable to be used within the expression.
  mush.funs.set("set", async (en, args, scope) => {
    if (args.length !== 2) {
      return "#-1 SET REQUIRES 2 ARGUMENTS";
    }

    const name = await parser.evaluate(en, args[0], scope);
    const value = await parser.evaluate(en, args[1], scope);
    scope[name] = value;
    return value;
  });
};
