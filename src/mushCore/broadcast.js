const parser = require("./parser");
const { db, objData } = require("./database");
const queue = require("./queues");
const flags = require("./flags");

/**
 * new Broadcast()
 */
class Broadcast {
  /**
   * This function sends text through the connected
   * socket to the user.  God I'm horrible at writing
   * these things.  Anyways:
   *
   * @param {string|object} socket either a single socket - or a list of
   * sockets that you want to send the message too.
   * @param {object} scope Any blocked variables passed from the parser.
   * @param {String} message The message to be sent over the socket.
   *
   */
  send(socket, message, options = {}) {
    const { scope = {}, parse = true } = options;
    try {
      if (parse) {
        socket.write(parser.run(message, scope) + "\r\n", "utf-8");
      } else {
        socket.write(parser.subs(message) + "\r\n", "utf-8");
      }
    } catch (error) {
      socket.write(parser.subs(message) + "\r\n", "utf-8");
    }
  }

  /**
   * sendList sends a message to an array of multiple sockets.
   * @param {Object[]} targets a list of targets a message is to be sent too.
   * @param {String} message The message to be sent.
   * @param {string} [flgs = ""] Any flag restrictions the message has 'connected' for instance.
   */
  sendList(socket, targets, message, flgs = "") {
    targets.forEach(async target => {
      if (
        flags.hasFlags(await objData.key(target), flgs) &&
        (queue.keyToSocket(target) &&
          queue.keyToSocket(target)._socket.writable &&
          target !== socket._key)
      ) {
        try {
          const tSocket = queue.keyToSocket(target);
          this.send(tSocket, message);
        } catch (error) {
          throw error;
        }
      }
    });
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
        `this error? That would be /amazing/! ${error.stack}\r\n`
    );
  }

  /**
   * Send an unknown command message to a socket.
   * @param {*} socket The Socket the message is being sent too.
   */
  huh(socket) {
    socket.write('Huh? Type "help" for help.\r\n');
  }
}

module.exports = new Broadcast();
