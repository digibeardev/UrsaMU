module.exports = mush => {
  // Misc functions

  // Set a variable to be used within the expression.
  mush.funs.set("set", (args, scope) => {
    if (args.length !== 2) {
      throw new SyntaxError("Set expects 2 arguments");
    }

    let value = mush.parser.run(socket._key, args[1], scope);
    scope[args[0].value] = value;
    return value;
  });
};
