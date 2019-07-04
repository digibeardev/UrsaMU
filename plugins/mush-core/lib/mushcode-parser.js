const broadcast = require("../../../src/broadcast");
const flags = require("./flags");
const database = require("./database");

/**
 * Create New MUSH Parser()
 * This parser is based off of an article I found on
 * writing a scripting language with JavaScript.
 * https://eloquentjavascript.net/12_language.html
 */
class Parser {
  constructor() {
    this.funs = new Map();
    this.cmds = new Map();
    this.sub = new Map();
    this.scope = {};
    this.help = require("./help");
    this.broadcast = broadcast;
    this.db = database;
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
      // If the character is something else throw an error.
      // Room for degubbing here later!
      throw new SyntaxError(`Unexpected Syntax: ${program}`);
    }
    // Now we test the rest of the string to see if it's a
    // function or a variable.
    return this.parseApply(expr, program.slice(match[0].length));
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
      } else if (program[0] != ")") {
        // Anything else throws an error.
        throw new SyntaxError("Expected ',' or ')'");
      }
    }
    // Make's function currying possible.  Not something
    // I really use, but it was in the example, so why not?
    // Easter egg? :D
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
        return expr.value;
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

  // For some text functions, we need to strip the substitution variables
  // from the text before we take into account things like character width.
  stripSubs(string) {
    // Remove color codes
    return string.replace(/%[cCxX]./g, "").replace(/%./g, "");
  }

  stripAnsi(string) {
    return require("strip-ansi")(string);
  }

  run(string, scope) {
    return this.subs(this.evaluate(this.parse(string), scope));
  }

  /**
   * Evaluate an input stream from the user for commands.
   * @param {Socket} socket The socket connection envoking the command
   * @param {String} string The raw input text from the socket.
   * @param {Object} scope  The variable scope for the command.
   */
  exe(socket, string, scope) {
    let ran = false;
    // Cycle through the commands on the command object looking for a
    //  match in the users input string.
    for (const command of this.cmds.values()) {
      const { pattern, run, restriction } = command;
      const match = string.match(pattern);
      const obj = flags.has(this.db.id(socket.id));

      // If there's a match and the enactor passes the flag restriction of
      // the command or there's no restriction set, try to run the command.
      if ((match && obj) || (match && !restriction)) {
        // Try/Catch block just in case the command doesn't
        // go through, there's an error, or if the command
        // just straight doesn't exist.
        try {
          ran = true;
          return run(socket, match, scope, this);
        } catch (error) {
          return this.broadcast.error(socket, error);
        }
      }
    }
    if (!ran) this.broadcast.send(socket, 'Huh? Type "help" for help.');
  }
}

module.exports = new Parser();
