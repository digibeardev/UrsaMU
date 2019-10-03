module.exports = parser => {
  // Math

  // Add a comma sperated list of integers together.
  // if the arg doesn't pass parseInt().
  parser.funs.set("add", (en, args, scope) => {
    if (args.length < 2) {
      throw new SyntaxError("add expects at least 2 arguments");
    }

    let total = 0;
    args.forEach(arg => {
      let value = parseInt(arg);
      if (Number.isInteger(value)) {
        total += value;
      }
    });
    return total.toString();
  });

  // Subtract two numbers.
  parser.funs.set("sub", (en, args, scope) => {
    if (args.length !== 2) {
      throw new SyntaxError("sub expects 2 arguments");
    }

    let num = parseInt(args[0]);
    let num2 = parseInt(args[1]);

    return (num - num2).toString();
  });

  // absolute value of an integer
  parser.funs.set("abs", (en, args, scope) => {
    if (args.length > 1) {
      throw new SyntaxError("abs expects 1 arguments");
    }

    let value = Number.parseInt(args[0]);
    if (Number.isInteger(value)) {
      return Math.abs(value).toString();
    } else {
      throw new SyntaxError("abs expects an interger");
    }
  });

  parser.funs.set("mul", (args, scope) => {
    if (args.length < 2 || args.length > 2) {
      throw new SyntaxError("mul requires 2 arguments");
    }

    const num1 = parseInt(args[0]);
    const num2 = parseInt(args[1]);
    return (num1 * num2).toString();
  });
};
