module.exports = parser => {
  parser.funs.set("itemize", async (en, args) => {
    let list = await args[0];
    const delim = (await args[1]) ? args[1] : " ";
    const conj = (await args[2]) ? args[2] : "and";
    const punc = (await args[3]) ? args[3] : ",";

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

  parser.funs.set("iter", (en, args, scope) => {
    const list = args[0];
    const idelim = args[2] ? args[2] : " ";
    const odelim = args[3] ? args[3] : " ";

    let output = "";
    for (const item of list.split(idelim)) {
      scope["##"] = item;
      scope["@#"] = list
        .split(idelim)
        .indexOf(item)
        .toString();

      output += args[1] + odelim;
    }
    return output;
  });
};
