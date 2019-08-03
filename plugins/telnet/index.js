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

    if (players.length <= 0) {
      mush.broadcast.send(
        socket,
        "%rNo %chArchitect%cn player login found.  Your first login will be given the flag. " +
          "We suggest you use it to create a %chWizard%cn player, then keep your first login safe!%cn%r"
      );
    }

    tSocket.on("data", buffer => {
      mush.queues.pQueue.push({ socket: tSocket, data: buffer.toString() });
    });
  });

  mush.log.success(
    `Starting Telnet server on port ${mush.config.get("telnet") || 3000}`
  );
  server.listen(mush.config.get("telnet") || 3000);
};
