class Broadcast {
  // Send a message over a socket connection.
  send(options) {
    const { msg, socket } = options;
    if (socket.type === "telnet") {
      // If msg contains the property message, it's probably a json
      // response.  Otherwise it's probably just text.
      socket.write(msg.msg + "\r\n");
    } else if (socketype === "websocket") {
      socket.write(msg.msg ? JSON.stringify(msg) : msg);
    } else {
      throw new Error("Unsupported socket type");
    }
  }
}

module.exports = new Broadcast();
