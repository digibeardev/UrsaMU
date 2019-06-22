const net = require("net");
const { TelnetSocket } = require("telnet-stream");
const fs = require("fs");

module.exports = app => {
  // Create a TCP server
  const server = net.createServer(socket => {
    const tSocket = new TelnetSocket(socket);
    tSocket.type = "telnet";
    const connect = fs.readFileSync(
      require("path").resolve(__dirname, "../mush-core/data/text/connect.txt")
    );

    tSocket.write(connect + "\r\n");
    // Send an emit about the connection, so we can add the socket to
    // our list of connections.
    app.emit("connected", tSocket);

    tSocket.on("data", buffer => {
      app.parser.exe(tSocket, buffer.toString(), app.parser.scope);
    });
  });

  console.log(`Starting Telnet server on port ${process.env.GAME_PORT}`);
  server.listen(process.env.GAME_PORT);
};
