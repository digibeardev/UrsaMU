const parser = require("./parser");
const emitter = require("./emitter");
const broadcast = require("./broadcast");
const db = require("./database");
const flags = require("./flags");
const config = require("./config");
const queue = require("./queues");
const { VM } = require("vm2");
const help = require("./help");
const grid = require("./grid");

module.exports = class UrsaMu {
  constructor(options = {}) {
    const { plugins } = options;
    this.help = help;
    this.grid = grid;
    this.parser = parser;
    this.broadcast = broadcast;
    this.emitter = emitter;
    this.cmds = new Map();
    this.txt = new Map();
    this.scope = {};
    this.log = require("./utilities").log;
    this.db = db;
    this.flags = flags;
    this.queues = queue;
    this.config = config;
    this.plugins = plugins;
    this.VM = VM;

    // Initialize in-game functionality.
    this.init();
  }

  init() {
    // Install in-game commands, functions, and pre-load
    // text files.
    let room;
    const rooms = this.db.find({ type: "room" });
    if (rooms.length <= 0) {
      this.log.warning("No Grid found.");
      room = this.db.insert({ name: "Limbo", type: "room" });
    }
    if (room) {
      this.log.success("Limbo succesfully dug.", 2);
      this.config.set("startingRoom", room.id);
    }

    require("./commands")(this);
    require("../text")(this);
    require("./exec")(this);
    require("./gameTimers")(this);

    // Clear all of the connected flags incase the server didn't go down clean.
    this.db.db
      .filter(entry => entry.type === "player")
      .forEach(entry => {
        this.flags.set(entry, "!connected");
      });
    this.db.save();

    // Run plugins if present.
    if (this.plugins) {
      this.plugin(this.plugins);
    }
  }

  /**
   * Force a player bit to execute a command
   * @param {Object} socket The socket of the enactor
   * @param {*} command The command to be executed
   * @param {*} args Any special arguments to pass along with the command
   */
  exe(socket, command, args = []) {
    try {
      return this.cmds.get(command).run(socket, args, this.scope);
    } catch (error) {
      throw error;
    }
  }

  // Check for plugins
  plugin(plugins) {
    // if plugins is an array, process the array.
    if (Array.isArray(plugins)) {
      plugins.forEach(plugin => {
        try {
          require(`../plugins/${plugin}`)(this);
          this.log.success(`Plugin installed: ${plugin}.`);
        } catch (error) {
          console.error(`ERROR: Could not import plugin: ${plugin}`);
          console.error(`ERROR: ${error.stack}`);
        }
      });

      // If it's a string, process the string.
    } else if (typeof plugins === "string") {
      try {
        require("../plugins/" + plugins)(this);
      } catch (error) {
        console.error(`ERROR: Could not import plugin: ${plugins}`);
        console.error(`ERROR: ${error}`);
      }

      // Else it's not a format the plugin system can read.
    } else {
      console.error(`ERROR: Unable to read plugin: ${plugins}.`);
    }
  }
};
