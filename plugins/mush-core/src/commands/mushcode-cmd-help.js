module.exports = parser => {
  parser.cmds.set("help", {
    pattern: /^\+?help/,
    run: args => {
      return console.log(
        parser.run("center(< Help System >,78,-)", parser.scope)
      );
    }
  });
};
