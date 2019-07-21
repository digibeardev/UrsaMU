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

    tSocket.write(mush.txt.get("connect.txt") + "\r\n");

    tSocket.on("data", buffer => {
      mush.exec(tSocket, buffer.toString(), mush.scope);
    });
  });

  console.log(
    `\u2714 SUCCESS: Starting Telnet server on port ${mush.config.ports
      .telnet || 3000}`
  );
  server.listen(mush.config.ports.telnet || 3000);
};
