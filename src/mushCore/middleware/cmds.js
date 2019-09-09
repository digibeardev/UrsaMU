module.exports = async (dataWrapper, next) => {
  const { input, game, socket } = dataWrapper;

  const mush = game;
  // Cycle through the commands on the command object looking for a
  //  match in the users input string if no matching exit was found.
  for (const command of mush.cmds.values()) {
    const { pattern, run, restriction } = command;
    const match = input.match(pattern);

    const obj = await mush.flags.hasFlags(
      await mush.db.key(socket._key),
      restriction
    );

    // If there's a match and the enactor passes the flag restriction of
    // the command or there's no restriction set, try to run the command.
    if ((match && obj) || (match && !restriction)) {
      // Try/Catch block just in case the command doesn't
      // go through, there's an error, or if the command
      // just straight doesn't exist.
      try {
        run(socket, match, mush.scope);
        dataWrapper.ran = true;
        next(null, dataWrapper);
      } catch (error) {
        next(error);
      }
    }
  }
  // No evaluation, return to the handler.
  next(null, dataWrapper);
};
