const db = require("./database");
const flags = require("./flags");
module.exports = mush => {
  /**
   * Evaluate an input stream from the user for commands.
   * @param {Socket} socket The socket connection envoking the command
   * @param {String} string The raw input text from the socket.
   * @param {Object} scope  The variable scope for the command.
   */

  mush.exec = (socket, string, scope) => {
    let ran = false;
    // Cycle through the commands on the command object looking for a
    //  match in the users input string.
    for (const command of mush.cmds.values()) {
      const { pattern, run, restriction } = command;
      const match = string.match(pattern);
      const obj = flags.has(db.id(socket.id));

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
  };
};
