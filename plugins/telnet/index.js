const net = require("net");
const { TelnetSocket } = require("telnet-stream");
const fs = require("fs");

module.exports = app => {
  // Create a TCP server
  const server = net.createServer(socket => {
    const tSocket = new TelnetSocket(socket);

    const connect = fs.readFileSync(
      require("path").resolve(__dirname, "../mush-core/data/text/connect.txt")
    );

    tSocket.write(connect + "\r\n");

    tSocket.on("data", buffer => {
      console.log(buffer.toString());
      // app.parser.exe(buffer.toString());
    });
  });

  console.log(`Starting Telnet server on port ${process.env.GAME_PORT}`);
  server.listen(process.env.GAME_PORT);
};
