/**
 * new Broadcast()
 */
class Broadcast {
  /**
   * This function sends text through the connected
   * socket to the user.  God I'm horrible at writing
   * these things.  Anyways:
   *
   * @param {string|object} socket - either a single socket - or a list of
   * sockets that you want to send the message too.
   * @param {object} options - Options represents the object
   * literal sent to the command.
   *
   */
  send(socket, options = "") {
    if (typeof options === "object") {
      const { msg } = options;

      if (Array.isArray(socket)) {
        for (let listener of socket) {
          if (listener.type === "telnet") {
            // If the socket type is telnet, it can only handle
            // the text portion of the request.
            listener.write(msg.msg ? msg.msg + "\n" : msg + "\n");
          } else if (listner.type === "websocket") {
            // If msg contains the property message, it's probably a json
            // response.  Otherwise it's probably just text.
            listener.write(msg.msg ? JSON.stringify(msg) : msg);
          } else {
            throw new Error("Unsupported socket type");
          }
        }
      } else {
        if (socket.type === "telnet") {
          // If the socket type is telnet, it can only handle
          // the text portion of the request.
          socket.write(msg.msg ? msg.msg + "\n" : msg + "\n");
        } else if (socketype === "websocket") {
          // If msg contains the property message, it's probably a json
          // response.  Otherwise it's probably just text.
          socket.write(msg.msg ? JSON.stringify(msg) : msg);
        } else {
          throw new Error("Unsupported socket type");
        }
      }
    } else {
      // It's just a string, pass it along.
      socket.write(options + "\n");
    }
  }

  /**
   * Send an error message to a socket
   * @param {*} socket - The socket the message is being sent to.
   * @param {*} error - The Error object message to send.
   */
  error(socket, error) {
    socket.write(
      "Congrats! You found a bug! Well this is embarrasing.. " +
        "If you could be so kind as to let someone on staff know that you ran into " +
        `this error? That would be /amazing/!\n\nERROR: ${error.stack}\n`
    );
  }

  /**
   * Send an unknown command message to a socket.
   * @param {*} socket The Socket the message is being sent too.
   */
  huh(socket) {
    socket.write('Huh? Type "help" for help.\n');
  }
}

module.exports = new Broadcast();
