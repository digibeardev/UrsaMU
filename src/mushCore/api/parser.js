const stringReplace = require("string-replace-async");
const moment = require("moment");
const { objData } = require("../database");
const flags = require("./flags");
const { log } = require("../../utilities");
const attrs = require("./attrs");
const broadcast = require("./broadcast");
const stats = require("./stats");
const queues = require("../systems/queues");
/**
 * Create New HoniKomu Parser()
 * The main mechinism is totally from here, with some modifications to
 * fit a more MUSH like language:
 * (https://eloquentjavascript.net/index.html)
 * It's an exellent and Open Source soulution to taking
 * your JavaScript to the next level(tm).
 */
class Parser {
  constructor() {
    this.db = objData;
    this.queues = queues;
    this.attrs = attrs;
    this.flags = flags;
    this.broadcast = broadcast;
    this.stats = stats;
    this.log = log;
    this.moment = moment;
    this.sub = new Map();
    this.funs = new Map();
    require("../systems/substitutions")(this);
    require("../functions")(this);
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
    program = program.replace(/%[(]/g, "\u250D").replace(/%[)]/g, "\u2511");
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

  async evaluate(en, expr, scope) {
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
        let output = expr.value;
        for (const key in scope) {
          output = output.replace(key, scope[key]);
        }

        return output ? output : expr.value;
      }

      // If the expression type is 'apply', check to see if a function
      // exists that matches the expression word.
    } else if (expr.type === "apply") {
      let { operator, args } = expr;

      if (operator.type === "word" && this.funs.has(operator.value)) {
        return await this.funs.get(operator.value)(en, args, scope);
      } else {
        throw SyntaxError("Not a defined function");
      }
    }
  }

  // Make input substitutions.
  subs(string) {
    this.sub.forEach((v, k) => {
      string = string.replace(k, v);
      string = string.replace(/%u([0-9a-f]+)/gi, (...args) => {
        return String.fromCodePoint(parseInt(args[1], 16));
      });
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

  async run(en, string, scope, options = { parse: true }) {
    const { parse } = options;

    // Determine if the text should be parsed, or just passed through.
    if (parse) {
      string = string.replace(/%[\[]/g, "&3").replace(/%[\]]/g, "&4");
      const replaced = await stringReplace(
        string,
        /\[([^\]]+)\]/g,
        async (...args) => {
          try {
            args[1].replace(/%[(]/g, "\u250D").replace(/%[)]/g, "\u2511");
            return await this.subs(
              await this.run(en, args[1], scope, { parse: true, en })
            );
          } catch (error) {
            return args[0];
          }
        }
      );

      try {
        return this.subs(await this.evaluate(en, this.parse(replaced), scope));
      } catch (error) {
        return this.subs(replaced);
      }
    } else {
      return string;
    }
  }
}

module.exports = new Parser();
