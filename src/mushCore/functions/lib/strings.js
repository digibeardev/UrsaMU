module.exports = parser => {
  // If statement logic.
  parser.funs.set("if", (en, args, scope) => {
    if (args.length < 2) {
      throw new SyntaxError("if expects at least 2 arguments");
    } else if (args[0] !== false) {
      return args[1];
    } else {
      return args[2] ? args[2] : "";
    }
  });

  // Ifelse statement logic.
  parser.funs.set("ifelse", (en, args, scope) => {
    if (args.length !== 3) {
      throw new SyntaxError("ifelse expects 3 arguments");
    } else if (args[0] !== false) {
      return args[1];
    } else {
      return args[2];
    }
  });

  // In order to keep things DRY, creating a function expression to render filler strings.
  const repeatString = (string = " ", length) => {
    // Check to see if the filler string contains ansii substitutions.  If so
    // split the characters of the string into an array and apply ansii substitutions.
    // Else just split the filler string into an array.

    // check how many spaces are left after the filler string is rendered. We will need
    // to render these last few spaces manually.
    const remainder = Math.floor(length % parser.stripSubs(string).length);

    // Split the array and filter out empty cells.
    let cleanArray = string.split("%").filter(Boolean);
    // If the array length is longer than 1 (more then one cell), process for ansii
    if (cleanArray.length > 1) {
      // If it's just a clear formatting call 'cn' then we don't need to worry
      // about it.  We'll handle making sure ansii is cleared after each substitution manually.
      cleanArray = cleanArray
        .filter(cell => {
          if (cell.toLowerCase() !== "cn") {
            return cell;
          }
        })

        // fire the substitutions on each cell.
        .map(cell => {
          return parser.subs("%" + cell + "%cn");
        });
    } else {
      cleanArray = cleanArray[0].split("");
    }
    return (
      string.repeat(length / parser.stripSubs(string).length) +
      cleanArray.slice(0, remainder)
    );
  };

  // Center text.
  parser.funs.set("center", (en, args, scope) => {
    if (args.length < 2) {
      throw new SyntaxError("center requires at least 2 arguments");
    } else {
      const message = args[0];
      const width = parseInt(args[1]);
      const repeat = args[2] ? args[2] : " ";

      // Check to see if the second arg is an integer
      if (Number.isInteger(width)) {
        // run the substitutions so I can strip away the ansi non-printables
        // while still retaining any spaces around the message.
        const length =
          (width - parser.stripAnsi(parser.subs(message)).length) / 2;
        const remainder = (width - parser.stripSubs(message).length) % 2;

        return (
          repeatString(repeat, length) +
          message +
          repeatString(repeat, length + remainder)
        );
      } else {
        throw new SyntaxError("center expects length as a number.");
      }
    }
  });

  // left justification
  parser.funs.set("ljust", (en, args, scope) => {
    const message = args[0];
    const filler = args[2] ? args[2] : " " ? args[2] : " ";
    const width = parseInt(args[1]);

    // Check to make sure we have the right number of arguments.
    if (args.length < 2) {
      return SyntaxError("ljust requres at least 2 arguments");
    }

    // If width is an integer format the string to width using
    // filler to fill empty spaces.
    if (Number.isInteger(width)) {
      const length = width - parser.stripAnsi(parser.subs(message)).length;
      return message + repeatString(filler, length);
    }
  });

  // left justification
  parser.funs.set("rjust", (en, args, scope) => {
    const message = args[0];
    const filler = args[2] ? args[2] : " " ? args[2] : " ";
    const width = parseInt(args[1]);

    // Check to make sure we have the right number of arguments.
    if (args.length < 2) {
      return SyntaxError("ljust requres at least 2 arguments");
    }

    // If width is an integer format the string to width using
    // filler to fill empty spaces.
    if (Number.isInteger(width)) {
      const length = width - parser.stripAnsi(parser.subs(message)).length;
      return repeatString(filler, length) + message;
    }
  });

  // repeat()
  parser.funs.set("repeat", (en, args, scope) => {
    if (args.length < 2) {
      return SyntaxError("repeat expects 2 arguments");
    }
    const message = args[0];
    const width = parseInt(args[1]);
    if (Number.isInteger(width)) {
      return message.repeat(width);
    }
  });

  // Columns
  parser.funs.set("columns", async (en, args, scope) => {
    if (args.length < 2) {
      return SyntaxError("columns expects 2 arguments");
    }
    const list = args[0];
    const cols = parseInt(args[1]) || 1;
    const sep = args[2];
    const delim = args[3] ? args[3] : " ";
    const indent = args[4] ? parseInt(args[4]) : 0;
    let output = "";
    let line = "";
    let count = 0;
    let width = Math.floor(78 / cols);

    for (let item of list.split(delim)) {
      const length = width - parser.stripAnsi(parser.subs(item)).length;
      if (count === cols) {
        output += line + "%r";
        item = item + repeatString(sep, length);
        line = item;
        count = 1;
      } else {
        item = item + repeatString(sep, length);
        line += item;
        count++;
      }
    }

    // Tack the last line onto the end! ^_^
    return "%s".repeat(indent) + output + line;
  });

  parser.funs.set("cat", (en, args, scope) => {
    let output = "";
    for (const arg of args) {
      output += " " + arg;
    }
    return output;
  });

  parser.funs.set("before", (en, args, scope) => {
    if (args.length !== 2)
      throw new SyntaxError("Before requires 2 arguments.");

    const str = args[0];
    const split = args[1];

    return str.split(split.trim())[0];
  });

  parser.funs.set("after", (en, args, scope) => {
    if (args.length !== 2)
      throw new SyntaxError("Before requires 2 arguments.");

    const str = args[0];
    const split = args[1];

    return str.split(split.trim())[1];
  });

  parser.funs.set("uni", (en, args, scope) => {
    return String.fromCodePoint(parseInt(args[0], 16));
  });
};
