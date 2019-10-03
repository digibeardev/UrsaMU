module.exports = mush => {
  // Misc functions

  // Set a variable to be used within the expression.
  mush.funs.set("set", (en, args, scope) => {
    if (args.length !== 2) {
      throw new SyntaxError("Set expects 2 arguments");
    }

    scope[args[0]] = args[1];
    return value;
  });
};
