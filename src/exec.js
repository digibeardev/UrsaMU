const { matchExit, move } = require("./movement");

module.exports = mush => {
  /**
   * Evaluate an input stream from the user for commands.
   * @param {Socket} socket The socket connection envoking the command
   * @param {String} string The raw input text from the socket.
   * @param {Object} scope  The variable scope for the command.
   */

  mush.exec = (socket, string, scope) => {
    let ran = false;
    // First we need to check to see if an exit name was enetered.
    const exit = matchExit(string);
    if (exit && run === false) {
      // Exit match was made.
      ran = true;
      move(mush.db.id(socket.id), exit);
    }

    // Cycle through the commands on the command object looking for a
    //  match in the users input string if no matching exit was found.
    if (!ran) {
      for (const command of mush.cmds.values()) {
        const { pattern, run, restriction } = command;
        const match = string.match(pattern);
        const obj = mush.flags.hasFlags(mush.db.id(socket.id), restriction);

        // If there's a match and the enactor passes the flag restriction of
        // the command or there's no restriction set, try to run the command.
        if ((match && obj) || (match && !restriction)) {
          // Try/Catch block just in case the command doesn't
          // go through, there's an error, or if the command
          // just straight doesn't exist.
          try {
            ran = true;
            return run(socket, match, scope);
          } catch (error) {
            return mush.broadcast.error(socket, error);
          }
        }
      }
    }
    if (!ran && socket.id) mush.broadcast.huh(socket);
  };
};
