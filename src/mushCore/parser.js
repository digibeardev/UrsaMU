/**
 * Create New MUSH Parser()
 */
class Parser {
  constructor() {
    this.sub = new Map();
    this.funs = new Map();
    require("./substitutions")(this);
    require("./functions")(this);
  }

  /**
   * parseExpression()
   * Break an expression down into it's individual types. Right now
   * it only suppords 'word' which is all the mush needs.
   *
   * NOTES: In the future, enable functions, bracket matching, and
   * debugging.
   *
   * @param {string} program The string representation of the code fed
   * to the mushcode parser.
   */
  parseExpression(program) {
    let match, expr;
    // This process is super RegEx heavy.  This basically means
    // anything that isn't `(),`
    if ((match = /^[^(),]+/.exec(program))) {
      // We hit one of those special characters.  Everything
      // before it becomes a 'word' object.
      expr = { type: "word", value: match[0].trim() };
    } else {
      expr = { type: "word", value: " " };
    }
    // Now we test the rest of the string to see if it's a
    // function or a variable.
    return this.parseApply(expr, program.slice(match ? match[0].length : 0));
  }

  /**
   * Check the expression to see if it's a function call or not.
   * @param {ExprObj} expr The current tokens that have been
   * read from the string.
   * @param {*} program  The rest of the program or string.
   */
  parseApply(expr, program) {
    if (program[0] !== "(") {
      return { expr: expr, rest: program };
    }

    // Remove the first character since we know it's
    // a '('.

    program = program.slice(1);
    // This node is a function.
    // NOTE:  Change this from apply to something else
    // for readability.
    expr = { type: "apply", operator: expr, args: [] };

    // Read each character until you hit a closing '')'
    while (program[0] != ")") {
      let arg = this.parseExpression(program);
      expr.args.push(arg.expr);
      program = arg.rest;
      // Everything before the comma is an argument for
      // the function.
      if (program[0] === ",") {
        program = program.slice(1);
        // Or it's a ')'
      } else if (program[0] !== ")") {
        // Anything else throws an error.
        if (program) {
          throw new SyntaxError("Expected ',' or ')'");
        } else {
          break;
        }
      }
    }

    return this.parseApply(expr, program.slice(1));
  }

  // Make sure an expression is being run, and not a random
  // string.
  parse(program) {
    let { expr, rest } = this.parseExpression(program);
    if (rest.length > 0) {
      throw new SyntaxError("Unexpected text after program");
    }
    return expr;
  }

  evaluate(expr, scope) {
    // If the expression is a word, check to see if it has defined
    // meaning, else just return the value of the word.
    if (expr.type === "word") {
      // Check to see if the expression has a value in scope, else
      // just return the value of the expression.
      if (scope[expr.value]) {
        return scope[expr.value];
      } else {
        // scope variables may be imbedded in longer strings, we'll have
        // to use regular expressions to make sure they're changed.
        let output = "";
        for (const key in scope) {
          output = expr.value.replace(key, scope[key]);
        }

        return output ? output : expr.value;
      }

      // If the expression type is 'apply', check to see if a function
      // exists that matches the expression word.
    } else if (expr.type === "apply") {
      let { operator, args } = expr;

      if (operator.type === "word" && this.funs.has(operator.value)) {
        return this.funs.get(operator.value)(args, scope);
      } else {
        throw SyntaxError("Not a defined function");
      }
    }
  }

  // Make input substitutions.
  subs(string) {
    this.sub.forEach((v, k) => {
      string = string.replace(k, v);
    });

    return string;
  }

  /**
   *  For some text functions, we need to strip the substitution variables
   * from the text before we take into account things like character width.
   * @param {string} string The string we'll be stripping the substitutions from.
   */
  stripSubs(string) {
    // Remove color codes
    return string.replace(/%[cCxX]./g, "").replace(/%./g, "");
  }

  /**
   * Strip ansi codes from text.
   * @param {string} string String to strip ansi from
   */
  stripAnsi(string) {
    return require("strip-ansi")(string);
  }

  // Absolutely cheating for now, until someone figures out how to nest
  // brackets with a grammar or something. :)
  /**
   * Evaluate a string through the mushcode parser.  As of right now, only one
   * level of bracket matching is supported.  Nested brackets are a known bug.
   * @param {string} string The string to evaluate.
   * @param {object} scope The context of the evaluation.
   */

  run(string, scope) {
    const replaced = string.trim().replace(/\[([^\]]+)\]/g, (...args) => {
      try {
        return this.subs(this.evaluate(this.parse(args[1]), scope));
      } catch (error) {
        return args[0];
      }
    });
    try {
      return this.subs(this.evaluate(this.parse(replaced), scope));
    } catch (error) {
      return this.subs(replaced);
    }
  }
}

module.exports = new Parser();
