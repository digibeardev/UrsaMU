const stripAnsi = require("strip-ansi");

module.exports = mush => {
  mush.help.add({
    name: "if",
    type: "function",
    category: "strings",
    entry: `
IF()
IFELSE()

  FUNCTION:     if(<expression>,<true string>[,<false string>])
              ifelse(<expression>,<true string>,<false string>)

  This function returns <true string> if BOOLEAN <expression> is TRUE,
  <false string> otherwise. Much more efficient than an equivalent switch().
  It can also return different messages based on whether <expression> is
  nothing or contains text.  if() does the same thing, but the third,
  <false string> argument is optional.
  `
  });

  // If statement logic.
  mush.funs.set("if", (args, scope) => {
    if (args.length < 2) {
      throw new SyntaxError("if expects at least 2 arguments");
    } else if (mush.evaluate(args[0], scope) !== false) {
      return mush.evaluate(args[1], scope);
    } else {
      return args[2] ? mush.evaluate(args[2], scope) : "";
    }
  });

  mush.help.add({
    name: "ifelse",
    type: "function",
    category: "strings",
    entry: `
IF()
IFELSE()

  FUNCTION:     if(<expression>,<true string>[,<false string>])
              ifelse(<expression>,<true string>,<false string>)

  This function returns <true string> if BOOLEAN <expression> is TRUE,
  <false string> otherwise. Much more efficient than an equivalent switch().
  It can also return different messages based on whether <expression> is
  nothing or contains text.  if() does the same thing, but the third,
  <false string> argument is optional.
  `
  });

  // Ifelse statement logic.
  mush.funs.set("ifelse", (args, scope) => {
    if (args.length !== 3) {
      throw new SyntaxError("ifelse expects 3 arguments");
    } else if (mush.evaluate(args[0], scope) !== false) {
      return mush.evaluate(args[1], scope);
    } else {
      return mush.evaluate(args[2], scope);
    }
  });

  // In order to keep things DRY, creating a function expression to render filler strings.
  const repeatString = (string = " ", length) => {
    // Check to see if the filler string contains ansii substitutions.  If so
    // split the characters of the string into an array and apply ansii substitutions.
    // Else just split the filler string into an array.

    // check how many spaces are left after the filler string is rendered. We will need
    // to render these last few spaces manually.
    const remainder = Math.floor(length % mush.stripSubs(string).length);

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
          return mush.subs("%" + cell + "%cn");
        });
    } else {
      cleanArray = cleanArray[0].split("");
    }
    return (
      string.repeat(length / mush.stripSubs(string).length) +
      cleanArray.slice(0, remainder)
    );
  };

  mush.help.add({
    name: "center",
    type: "function",
    category: "strings",
    entry: `
CENTER()

  FUNCTION: center(<string>, <width>[, <fill>])

  This function centers <string> within a <width>-sized field.

  The background of this field is specified by a repeating pattern of <fill>
  characters. The origin of this repeating pattern is at the first position
  of the field. Another way of saying this is that the repeating pattern
  starts in first position and repeats to the right. The last <fill> pattern
  may be truncated.

  By default, <fill> is a single, normal-colored space. The color of
  <string> and <fill> is maintained.

  If the visual width of <string> is longer than <width> characters, it is
  truncated to fit.

  Example:
    > say center(a,5,-)
    You say, "--a--"
    > say center(*BAMF*,15)
    You say, "    *BAMF*     "
    > say center(%xh%xrR%xgG%xbB,31,%xy--%xm+)
    --+--+--+--+--RGB+--+--+--+--+-

  Related Topics: cpad(), ljust(), lpad(), rjust(), rpad().

  `
  });

  // Center text.
  mush.funs.set("center", (args, scope) => {
    if (args.length < 2) {
      throw new SyntaxError("center requires at least 2 arguments");
    } else {
      const message = mush.evaluate(args[0], scope);
      const width = parseInt(mush.evaluate(args[1], scope), 10);
      const repeat = mush.evaluate(args[2], scope)
        ? mush.evaluate(args[2], scope)
        : " ";

      // Check to see if the second arg is an integer
      if (Number.isInteger(width)) {
        // run the substitutions so I can strip away the ansi non-printables
        // while still retaining any spaces around the message.
        const length = (width - mush.stripAnsi(mush.subs(message)).length) / 2;
        const remainder = (width - mush.stripSubs(message).length) % 2;

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

  mush.help.add({
    name: "ljust",
    type: "function",
    category: "strings",
    entry: `
LJUST()

  FUNCTION: ljust(<string>, <width>[, <fill>])

  This function left-justifies <string> within a <width>-sized field. That
  is, it positions <string> visually in the left-most part of a
  <width>-sized field.

  The background of this field is specified by a repeating pattern of <fill>
  characters. The origin of this repeating pattern is at the first position
  of the field. Another way of saying this is that the repeating pattern
  starts in first position and repeats to the right. The last <fill> pattern
  may be truncated.

  By default, <fill> is a single, normal-colored space. The color of
  <string> and <fill> is maintained.

  If the visual width of <string> is longer than <width> characters, it is
  truncated to fit.

  Examples:
    > say -[ljust(foo,6)]-
    You say, "-foo   -"
    > say %r0[ljust(foo,6)]7%r01234567
    You say, "
    0foo   7
    01234567"
    > say =[ljust(bar,5,.)]=
    You say, "=bar..="
    > say ljust(%xh%xrR%xgG%xbB,31,%xy--%xm+)
    RGB--+--+--+--+--+--+--+--+--+-`
  });

  // left justification
  mush.funs.set("ljust", (args, scope) => {
    const message = mush.evaluate(args[0], scope);
    const filler = mush.evaluate(args[2] ? args[2] : " ", scope)
      ? mush.evaluate(args[2], scope)
      : " ";
    const width = parseInt(mush.evaluate(args[1], scope));

    // Check to make sure we have the right number of arguments.
    if (args.length < 2) {
      return SyntaxError("ljust requres at least 2 arguments");
    }

    // If width is an integer format the string to width using
    // filler to fill empty spaces.
    if (Number.isInteger(width)) {
      const length = width - mush.stripAnsi(mush.subs(message)).length;
      return message + repeatString(filler, length);
    }
  });

  mush.help.add({
    name: "rjust",
    type: "function",
    category: "strings",
    entry: `
RJUST()

FUNCTION: rjust(<string>, <width>[, <fill>])

This function right-justifies <string> within a <width>-sized field. That
is, it positions <string> visually in the right-most part of a
<width>-sized field.

The background of this field is specified by a repeating pattern of <fill>
characters. The origin of this repeating pattern is at the first position
of the field. Another way of saying this is that the repeating pattern
starts in first position and repeats to the right. The last <fill> pattern
may be truncated.

By default, <fill> is a single, normal-colored space. The color of
<string> and <fill> is maintained.

If the visual width of <string> is longer than <width> characters, it is
truncated to fit.

Examples:
  > say -[rjust(foo,6)]-
  You say, "-   foo-"
  > say %r0[rjust(foo,6)]7%r01234567
  You say, "
  0   foo7
  01234567"
  > say =[rjust(bar,5,.)]=
  You say, "=..bar="
  > say rjust(%xh%xrR%xgG%xbB,31,%xy--%xm+)
  --+--+--+--+--+--+--+--+--+-RGB

Related Topics: center(), cpad(), ljust(), lpad(), rpad().`
  });

  // left justification
  mush.funs.set("rjust", (args, scope) => {
    const message = mush.evaluate(args[0], scope);
    const filler = mush.evaluate(args[2] ? args[2] : " ", scope)
      ? mush.evaluate(args[2], scope)
      : " ";
    const width = parseInt(mush.evaluate(args[1], scope));

    // Check to make sure we have the right number of arguments.
    if (args.length < 2) {
      return SyntaxError("ljust requres at least 2 arguments");
    }

    // If width is an integer format the string to width using
    // filler to fill empty spaces.
    if (Number.isInteger(width)) {
      const length = width - mush.stripAnsi(mush.subs(message)).length;
      return repeatString(filler, length) + message;
    }
  });

  mush.help.add({
    name: "repeat",
    type: "function",
    category: "strings",
    entry: `
REPEAT()

FUNCTION: repeat(<string>,<number>)

This function simply repeats <string>, <number> times.  No spaces are
inserted between each repetition.

Example:
  > say repeat(Test, 5)
  You say, "TestTestTestTestTest"
  
`
  });

  // repeat()
  mush.funs.set("repeat", (args, scope) => {
    if (args.length < 2) {
      return SyntaxError("repeat expects 2 arguments");
    }
    const message = mush.evaluate(args[0], scope);
    const width = parseInt(mush.evaluate(args[1], scope));
    if (Number.isInteger(width)) {
      return message.repeat(width);
    }
  });
};
