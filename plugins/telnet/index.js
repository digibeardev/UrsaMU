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
    const connect = fs.readFileSync(
      require("path").resolve(__dirname, "../mush-core/data/text/connect.txt")
    );

    tSocket.write(connect + "\n");
    // Send an emit about the connection, so we can add the socket to
    // our list of connections
    tSocket.on("data", buffer => {
      mush.parser.exe(tSocket, buffer.toString(), mush.parser.scope);
    });
  });

  console.log(`Starting Telnet server on port ${process.env.GAME_PORT}`);
  server.listen(process.env.GAME_PORT);
};
