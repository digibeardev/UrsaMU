module.exports = parser => {
  // Math

  // Add a comma sperated list of integers together.
  // if the arg doesn't pass parseInt().
  parser.funs.set("add", async (en, args, scope) => {
    if (args.length < 2) {
      throw new SyntaxError("add expects at least 2 arguments");
    }

    let total = 0;
    for (const arg of args) {
      let value = parseInt(await parser.evaluate(en, arg, scope));
      if (Number.isInteger(value)) {
        total += value;
      }
    }

    return total.toString();
  });

  // Subtract two numbers.
  parser.funs.set("sub", async (en, args, scope) => {
    if (args.length !== 2) {
      throw new SyntaxError("sub expects 2 arguments");
    }

    let num = parseInt(await parser.evaluate(en, args[0], scope));
    let num2 = parseInt(await parser.evaluate(en, args[1], scope));

    return (num - num2).toString();
  });

  // absolute value of an integer
  parser.funs.set("abs", async (en, args, scope) => {
    if (args.length > 1) {
      throw new SyntaxError("abs expects 1 arguments");
    }

    let value = Number.parseInt(await parser.evaluate(en, args[0], scope));
    if (Number.isInteger(value)) {
      return Math.abs(value).toString();
    } else {
      throw new SyntaxError("abs expects an interger");
    }
  });

  parser.funs.set("mul", async (en, args, scope) => {
    if (args.length < 2 || args.length > 2) {
      throw new SyntaxError("mul requires 2 arguments");
    }

    const num1 = parseInt(await parser.evaluate(en, args[0], scope));
    const num2 = parseInt(await parser.evaluate(en, args[1], scope));
    return (num1 * num2).toString();
  });
};
