const fs = require("fs");
const net = require("net");
const config = require("../../Data/config.json");

// I chose this library, because it handles the technical part
// of working with telnet protocol bytes.  Interesting stuff
// but not something I want to re-invent the wheel on!
const { TelnetSocket } = require("telnet-stream");

module.exports = mush => {
  // Create a TCP server
  const server = net.createServer(socket => {
    const tSocket = new TelnetSocket(socket);
    tSocket.type = "telnet";

    (async () => {
      const players = await mush.db.find(
        `FOR obj IN objects
          FILTER obj.type == "player"
          RETURN obj 
        `
      );
      const playerArray = await players.all();
      tSocket.write(mush.parser.subs(mush.txt.get("connect.txt")) + "\r\n");

      if (playerArray.length <= 0) {
        mush.broadcast.send(
          socket,
          "%rNo %chImmortal%cn player login found.  Your first login will be given the flag. " +
            "We suggest you use it to create a %chWizard%cn player, then keep your first login safe!%cn%r"
        );
      }
    })();

    tSocket.on("data", buffer => {
      tSocket.timestamp = new Date().getTime() / 1000;
      mush.queues.pQueue.push({ socket: tSocket, data: buffer.toString() });
    });

    tSocket.on("close", tSocket => mush.emitter.emit("close", tSocket));
  });

  mush.log.success(
    `Starting Telnet server on port ${config.connections.telnet || 3000}`
  );
  server.listen(config.connections.telnet || 3000);
};
