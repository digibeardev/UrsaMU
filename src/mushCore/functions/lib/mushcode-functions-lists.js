module.exports = parser => {
  parser.funs.set("itemize", (args, scope) => {
    let list = parser.evaluate(args[0], scope);
    const delim = args[1] ? parser.evaluate(args[1], scope) : " ";
    const conj = args[2] ? parser.evaluate(args[2], scope) : "and";
    const punc = args[3] ? parser.evaluate(args[3], scope) : ",";

    list = list.split(delim);

    if (list.length === 1) {
      return list[0];
    } else if (list.length === 2) {
      return list[0] + " " + conj + " " + list[1];
    } else if (list.length > 2) {
      let lastEl = list.pop();
      let output = list.reduce((acc, curr) => {
        return (acc = acc + punc + " " + curr);
      });
      output += " " + conj + " " + lastEl;
      return output;
    } else {
      return "";
    }
  });

  parser.funs.set("iter", (args, scope) => {
    const list = parser.evaluate(args[0], scope);
    const idelim = args[2] ? parser.evaluate(args[2], scope) : " ";
    const odelim = args[3] ? parser.evaluate(args[3], scope) : " ";

    let output = "";
    for (const item of list.split(idelim)) {
      scope["##"] = item;
      scope["@#"] = list
        .split(idelim)
        .indexOf(item)
        .toString();

      output += parser.evaluate(args[1], scope) + odelim;
    }
    return output;
  });
};
