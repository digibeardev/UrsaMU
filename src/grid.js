const db = require("./database");
const _ = require("lodash");
const config = require("./config");
const { log } = require("./utilities");

/**
 * Create new Grid()
 * handle commands related to building the In-Game map.
 */
class Grid {
  constructor() {
    this.init();
  }

  /**
   * Initiate the in-game grid
   */
  init() {
    if (!_.find(db.db, { type: "room" })) {
      log.warning("No Grid found. Creating Limbo.");
      const { room } = this.dig({}, "Limbo");
      if (room) {
        log.success(`Limbo created.`, 2);
        config.set({ startingRoom: room.id });
        config.save();
      } else {
        log.error("Couldn't create limbo");
      }
    }
  }

  /**
   * Dig a new room and link the exits associated with it.
   * @param {object} socket The socket of the player invoking
   * the method
   * @param {string} name The name of the room we want to dig.
   * @param {*} toExit The exit that leads from your current
   * location to the newly dug room.
   * @param {*} fromExit The exit from the newly dug room back to
   * your current location.
   */
  dig(socket, name, toExit = "", fromExit = "") {
    // Get information about the rooms involved with the change.
    const room = db.insert({
      name: name,
      type: "room",
      owner: socket.id
    });

    const curRoom = db.id(socket.id)
      ? db.id(socket.id).location
      : { id: "", exits: [] };

    let toexit;
    // Create the exits
    if (toExit) {
      toexit = db.update({
        name: toExit,
        type: "exit",
        location: curRoom.id,
        owner: socket.id || ""
      });
    }

    if (curRoom.id) {
      db.update(curRoom.id, {
        exits: [...curRoom.exits, ...toexit.id]
      });
    }

    // Check to see if there's a return exit involved.
    let fromexit;
    if (fromExit) {
      fromexit = db.update({
        name: fromExit,
        type: "exit",
        location: room.id,
        owner: socket.id || ""
      });

      db.update(room.id, { exits: [...room.exits, ...fromexit] });
      db.save();
    }

    db.save();
    // Return the created objects!
    return { room, toexit, fromexit };
  }

  /**
   * Open a new exit.
   * @param {string} name The name of the exit you want to open.
   * @param {string} room The ID of the room where the exit is to
   * be opened.
   */
  open(name, room) {
    const exit = db.update({
      name,
      type: "exit",
      location: room.id
    });

    db.save();
    return exit;
  }
}

module.exports = new Grid();
