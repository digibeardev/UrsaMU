const { matchExit, move } = require("./movement");
const parser = require("./parser");
const { find } = require("lodash");

module.exports = mush => {
  /**
   * Evaluate an input stream from the user for commands.
   * @param {Socket} socket The socket connection envoking the command
   * @param {String} string The raw input text from the socket.
   * @param {Object} scope  The variable scope for the command.
   */

  mush.exec = (socket, string, scope) => {
    let ran = false;

    // We only need to search for exits if the bit is actually logged in.
    if (socket.id) {
      const enactor = mush.db.id(socket.id);
      const curRoom = mush.db.id(enactor.location);
      // First we need to check to see if an exit name was enetered.
      const exit = matchExit(curRoom, string);
      if (exit && !ran) {
        // Exit match was made.
        ran = true;
        move(socket, exit);
        mush.exe(socket, "look", []);
      }
    }

    // We only need to search for channels if the socket is actually
    // logged in.
    if (socket.id) {
      const enactor = mush.db.id(socket.id);
      // We need to split the input string, and try and match it to
      // any channel definitions.
      const [alias, ...rest] = string.split(" ");
      const chan = find(enactor.channels, { alias });
      const channel = mush.channels.get(chan.name);
      string = string.replace("\r\n", "\n");
      if (chan) {
        let msg = "";
        if (rest.join(" ")[0] === ":") {
          msg += `${
            enactor.moniker ? enactor.moniker : enactor.name
          } ${rest.join(" ").slice(1)}`;
        } else if (rest.join(" ")[0] === ";") {
          msg += `${
            enactor.moniker ? enactor.moniker : enactor.name
          }${rest.join(" ").slice(1)}`;
        } else {
          msg += `${
            enactor.moniker ? enactor.moniker : enactor.name
          } says "${rest.join(" ").trim()}"`;
        }

        mush.emitter.emit("channel", channel, msg.trim());
        ran = true;
      }
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
