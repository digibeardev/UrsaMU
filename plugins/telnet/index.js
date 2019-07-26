const fs = require("fs");
const net = require("net");

// I chose this library, because it handles the technical part
// of working with telnet protocol bytes.  Interesting stuff
// but not something I want to re-invent the wheel on!
const { TelnetSocket } = require("telnet-stream");

module.exports = mush => {
  // Create a TCP server
  const server = net.createServer(socket => {
    const tSocket = new TelnetSocket(socket);
    tSocket.type = "telnet";
    const players = mush.db.find({ type: "player" });

    tSocket.write(mush.parser.subs(mush.txt.get("connect.txt")) + "\r\n");

    if (!players) {
      mush.broadcast.send(
        socket,
        ">> No %chGod%cn player found.  Your first login will be given the flag. " +
          "I suggest you use it to create a %chWizard%cn player, then keep your first login safe!%cn"
      );
    }

    tSocket.on("data", buffer => {
      mush.exec(tSocket, buffer.toString(), mush.scope);
    });
  });

  mush.log.success(
    `Starting Telnet server on port ${mush.config.get("telnet") || 3000}`
  );
  server.listen(mush.config.get("telnet") || 3000);
};
