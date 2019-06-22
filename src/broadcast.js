class Broadcast {
  // Send a message over a socket connection.
  send(socket, options = "") {
    if (typeof options === "object") {
      const { msg } = options;
      if (socket.type === "telnet") {
        // If the socket type is telnet, it can only handle
        // the text portion of the request.
        socket.write(msg.msg ? msg.msg + "\r\n" : msg + "\r\n");
      } else if (socketype === "websocket") {
        // If msg contains the property message, it's probably a json
        // response.  Otherwise it's probably just text.
        socket.write(msg.msg ? JSON.stringify(msg) : msg);
      } else {
        throw new Error("Unsupported socket type");
      }
    } else {
      // It's just a string, pass it along.
      socket.write(options + "\r\n");
    }
  }
}

module.exports = new Broadcast();
