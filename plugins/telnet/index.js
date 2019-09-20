const net = require("net");

// I chose this library, because it handles the technical part
// of working with telnet protocol bytes.  Interesting stuff
// but not something I want to re-invent the wheel on!
const { TelnetSocket } = require("telnet-stream");

module.exports = mush => {
  // Create a TCP server
  const server = net.createServer(socket => {
    const tSocket = new TelnetSocket(socket);
    tSocket.setEncoding("utf8");
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
      mush.queues.pQueue.push({
        socket: tSocket,
        data: buffer.toString("utf8")
      });
    });

    tSocket.on("close", tSocket => mush.emitter.emit("close", tSocket));
    tSocket.on("exit", tSocket => mush.emitter.emit("close", tSocket));
  });

  server.listen(mush.config.get("connections.telnet") || 3000, () => {
    mush.log.success(
      `Starting Telnet server on port ${mush.config.get("connections.telnet") ||
        3000}`
    );
  });
};
