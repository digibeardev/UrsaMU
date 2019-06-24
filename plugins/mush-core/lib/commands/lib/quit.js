// This is the quit command for the game.  It can be run for one
module.exports = mush => {
  mush.cmds.set("quit", {
    pattern: /^quit\s/i,
    run: socket => socket.end("*** UrsaMU Disconnected ***\n")
  });
};
