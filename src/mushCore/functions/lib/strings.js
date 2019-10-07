module.exports = parser => {
  // If statement logic.
  parser.funs.set("if", async (en, args, scope) => {
    let cond = await parser.evaluate(en, args[0], scope);
    if (Number.isInteger(parseInt(cond))) {
      cond = parseInt(cond);
    }
    const string = await parser.evaluate(en, args[1], scope);
    if (args.length < 2) {
      return "#-1 IF REQUIRES 2 ARGUMENTS";
    } else if (cond) {
      return string;
    } else {
      return "";
    }
  });

  // Ifelse statement logic.
  parser.funs.set("ifelse", async (en, args, scope) => {
    let cond = await parser.evaluate(en, args[0], scope);
    if (Number.isInteger(parseInt(cond))) {
      cond = parseInt(cond);
    }
    const string = await parser.evaluate(en, args[1], scope);
    const string2 = args[2] ? await parser.evaluate(en, args[2], scope) : "";
    if (args.length >= 3 && args.length < 2) {
      return "#-1 IFELSE REQUIRES TWO TO THREE ARGUMENTS";
    } else if (cond) {
      return string;
    } else {
      return string2;
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
  parser.funs.set("center", async (en, args, scope) => {
    if (args.length < 2) {
      throw new SyntaxError("center requires at least 2 arguments");
    } else {
      const message = await parser.evaluate(en, args[0], scope);
      const width = parseInt(await parser.evaluate(en, args[1], scope));
      const repeat = args[2] ? await parser.evaluate(en, args[2], scope) : " ";

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
  parser.funs.set("ljust", async (en, args, scope) => {
    let message = await parser.evaluate(en, args[0], scope);
    message = message.replace(/%[(]/g, "\u250D").replace(/%[)]/g, "\u2511");
    const filler = args[2] ? await parser.evaluate(en, args[2], scope) : " ";
    const width = parseInt(await parser.evaluate(en, args[1], scope), 10);

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
  parser.funs.set("rjust", async (en, args, scope) => {
    const message = await parser.evaluate(en, args[0], scope);
    const filler = args[2] ? await parser.evaluate(en, args[2], scope) : " ";
    const width = parseInt(await parser.evaluate(en, args[1], scope));

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
  parser.funs.set("repeat", async (en, args, scope) => {
    if (args.length < 2) {
      return "#-1 REPEAT EXPECTS 2 ARGUMENTS";
    }
    const message = await parser.evaluate(en, args[0], scope);
    const width = parseInt(await parser.evaluate(en, args[1], scope));
    if (Number.isInteger(width)) {
      return message.repeat(width);
    }
  });

  // Columns
  parser.funs.set("columns", async (en, args, scope) => {
    if (args.length < 2) {
      return "#-1 COLUMNS EXPECTS 2 ARGUMENTS";
    }
    const list = await parser.evaluate(en, args[0], scope);
    const cols = parseInt(await parser.evaluate(en, args[1], scope)) || 1;
    const sep = args[2] ? await parser.evaluate(en, args[2], scope) : " ";
    const delim = args[3] ? await parser.evaluate(en, args[3], scope) : " ";
    const indent = args[4]
      ? parseInt(await parser.evaluate(en, args[4], scope))
      : 0;
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

  parser.funs.set("cat", async (en, args, scope) => {
    let output = "";
    for (const arg of args) {
      output += await parser.evaluate(en, arg, scope);
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
