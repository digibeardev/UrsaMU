module.exports = parser => {
  // Math

  // Add a comma sperated list of integers together.
  // if the arg doesn't pass parseInt().
  parser.funs.set("add", (args, scope) => {
    if (args.length < 2) {
      throw new SyntaxError("add expects at least 2 arguments");
    }

    let total = 0;
    args.forEach(arg => {
      let value = parseInt(parser.evaluate(arg, scope), 10);
      if (Number.isInteger(value)) {
        total += value;
      }
    });
    return total.toString();
  });

  // Subtract two numbers.
  parser.funs.set("sub", (args, scope) => {
    if (args.length !== 2) {
      throw new SyntaxError("sub expects 2 arguments");
    }

    let num = parseInt(parser.evaluate(args[0], scope), 10);
    let num2 = parseInt(parser.evaluate(args[1], scope), 10);

    return (num - num2).toString();
  });

  // absolute value of an integer
  parser.funs.set("abs", (args, scope) => {
    if (args.length > 1) {
      throw new SyntaxError("abs expects 1 arguments");
    }

    let value = Number.parseInt(parser.evaluate(args[0], scope));
    if (Number.isInteger(value)) {
      return Math.abs(value).toString();
    } else {
      throw new SyntaxError("abs expects an interger");
    }
  });
};
