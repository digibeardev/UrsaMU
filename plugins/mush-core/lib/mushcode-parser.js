const broadcast = require("../../../src/broadcast");
const flags = require("./flags");
const database = require("./database");

// This parser is based off of an article I found on writing a
// scripting language with JavaScript.
// https://eloquentjavascript.net/12_language.html
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

  // Break an expresison down into it's individual types.  Right now
  // it only supports 'word' which is really all mushcode needs.
  parseExpression(program) {
    let match, expr;
    if ((match = /^[^(),]+/.exec(program))) {
      expr = { type: "word", value: match[0].trim() };
    } else {
      throw new SyntaxError(`Unexpected Syntax: ${program}`);
    }

    return this.parseApply(expr, program.slice(match[0].length));
  }

  // Check the expression to see if it's a function call or not.
  parseApply(expr, program) {
    if (program[0] !== "(") {
      return { expr: expr, rest: program };
    }

    program = program.slice(1);
    expr = { type: "apply", operator: expr, args: [] };
    while (program[0] != ")") {
      let arg = this.parseExpression(program);
      expr.args.push(arg.expr);
      program = arg.rest;

      if (program[0] === ",") {
        program = program.slice(1);
      } else if (program[0] != ")") {
        throw new SyntaxError("Expected ',' or ')'");
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
    // Cycle through the commands on the command object looking for a
    //  match in the users input string.
    for (let command of this.cmds.values()) {
      const match = command.pattern.exec(string) || [];
      match.lastIndex = 0;
      // If there's a match and the enactor passes the flag restriction of
      // the command or there's none set, try to run the command.
      if (
        (match.length > 0 &&
          flags.has(this.db.id(socket.id) || {}, command.restriction)) ||
        (match.length > 0 && !command.restricted)
      ) {
        // Try/Catch block just in case the command doesn't
        // go through, there's an error, or if the command
        // just straight doesn't exist.
        try {
          return command.run(socket, match, scope, this);
        } catch (error) {
          return this.broadcast.error(socket, error);
        }
      } else {
        return this.broadcast.send(socket, 'Huh? Type "help" for help.');
      }
    }
  }
}

module.exports = new Parser();
