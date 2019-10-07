const parser = require("./parser");
const { db, objData } = require("../database");
const queue = require("../systems/queues");
const flags = require("./flags");
const { log } = require("../../utilities");
const { difference } = require("lodash");
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
  async send(socket, message, options = {}) {
    const { scope = {}, parse = true, en = socket._key } = options;

    if (parse) {
      socket.write(
        (await parser
          .run(en, message, scope, {
            parse: true
          })
          .catch(error => {
            socket.write(
              parser
                .subs(message)
                .replace("\u250D", "(")
                .replace("\u2511", ")")
                .replace(/┍/g, "(")
                .replace(/┑/g, ")")
                .replace(/&3/g, "[")
                .replace(/&4/g, "]") + "\r\n"
            );
          }))
          .replace("\u250D", "(")
          .replace("\u2511", ")")
          .replace(/┍/g, "(")
          .replace(/┑/g, ")")
          .replace(/&3/g, "[")
          .replace(/&4/g, "]") + "\r\n"
      );
    } else {
      socket.write(
        message
          .replace("\u250D", "(")
          .replace("\u2511", ")")
          .replace(/┍/g, "(")
          .replace(/┑/g, ")")
          .replace(/&3/g, "[")
          .replace(/&4/g, "]") + "\r\n"
      );
    }
  }

  /**
   * sendList sends a message to an array of multiple sockets.
   * @param {Object[]} targets a list of targets a message is to be sent too.
   * @param {String} message The message to be sent.
   * @param {string} [flgs = ""] Any flag restrictions the message has 'connected' for instance.
   */
  async sendList(socket, targets, message, flgs = "") {
    try {
      for (const target of targets) {
        if (
          flags.hasFlags(await objData.key(target), flgs) &&
          (queue.keyToSocket(target) &&
            queue.keyToSocket(target)._socket.writable &&
            target !== socket._key)
        ) {
          const tSocket = queue.keyToSocket(target);
          await this.send(tSocket, message);
        }
      }
    } catch (error) {
      log.error(error);
    }
  }

  /**
   *
   * @param {Object<Any>} options Options to pass to the command
   * @param {String[]} options.dbrefs A list of database reference numbers.
   * @param {String} options.message The message to send to each dbref.
   * @param {String} [options.flags=""] The list of flags the dbref must have in order
   * to get the message.
   * @param {String[]} [options.ignore] A list of dbrefs that shouldn't recieve the
   * the message
   */
  async sendGroup({ enactor, targets, message, flag = "", ignore = [] }) {
    const list = difference(targets, ignore);
    const sockets = [];
    const enSocket = await queue.keyToSocket(enactor._key);

    for (const target of list) {
      const socket = queue.keyToSocket(target._key);

      if (socket && (await flags.hasFlags(target, flag))) {
        sockets.push(socket);
        // If no socket, take it off the send list.
      } else {
        list.splice(list.indexOf(target), 1);
      }
    }

    // One recipient
    if (sockets.length === 1) {
      const target = await objData.key(sockets[0]._key);
      await this.send(sockets[0], `From afar, ${message}`);
      if (enSocket) {
        this.send(
          enSocket,
          `To ${target.moniker ? target.moniker : target.name}${
            target.alias ? "(" + target.alias + ")" : ""
          }, ${message}`
        );
      }

      // Multiple recipients
    } else if (sockets.length > 1) {
      for (const socket of sockets) {
        await this.send(
          socket,
          `Long distance to ([itemize(${list.map(el =>
            el.moniker ? el.moniker : el.name
          )}${el.alias ? "(" + el.alias + ")" : ""}]) ${message}`
        );
      }
    } else {
      await this.send(enSocket, "No one to message.");
    }
  }

  sendAll(message) {
    queue.sockets.forEach(v => {
      this.send(v, message);
    });
  }

  /**
   * Send an error message to a socket
   * @param {*} socket - The socket the message is being sent to.
   * @param {*} error - The Error object message to send.
   */
  error(socket, error) {
    socket.write(
      "Congrats! You found a bug! Well this is embarrasing... " +
        "If you could be so kind as to let someone on staff know that you ran into " +
        `this error? That would be super cool! Error: ${error}\r\n`
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
