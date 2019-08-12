const parser = require("./parser");
const emitter = require("./emitter");
const broadcast = require("./broadcast");
const db = require("./database");
const flags = require("./flags");
const config = require("./config");
const queue = require("./queues");
const { VM } = require("vm2");
const help = require("./helpsys");
const grid = require("./grid");
const attrs = require("./attributes");
module.exports = class UrsaMu {
  constructor(options = {}) {
    const { plugins } = options;
    this.attrs = attrs;
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

    // Check for server events!
    this.emitter.on("connected", socket => {
      const enactor = this.db.id(socket.id);
      const curRoom = this.db.id(enactor.location);
      this.broadcast.sendList(
        socket,
        curRoom.contents,
        `${enactor.name} has connected.`,
        "connected"
      );
    });

    this.emitter.on("disconnected", socket => {
      const enactor = this.db.id(socket.id);
      const curRoom = this.db.id(enactor.location);
      this.broadcast.sendList(
        socket,
        curRoom.contents,
        `${enactor.name} has disconnected.`,
        "connected"
      );
    });

    this.emitter.on("close", socket => {
      if (socket.id) {
        const enactor = this.db.id(socket.id);
        const curRoom = this.db.id(enactor.location);
        this.broadcast.sendList(
          socket,
          curRoom.contents,
          `${enactor.name} has disconnected.`,
          "connected"
          this.queues.sockets.delete(socket)
          );
      }
    });
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
          this.log.error(`Could not import plugin: ${plugin}`);
          this.log.error(`${error.stack}`);
        }
      });

      // If it's a string, process the string.
    } else if (typeof plugins === "string") {
      try {
        require("../plugins/" + plugins)(this);
      } catch (error) {
        this.log.error(`Could not import plugin: ${plugins}`);
        this.log.error(`${error.stack}`);
      }

      // Else it's not a format the plugin system can read.
    } else {
      this.logs.error(`Unable to read plugin: ${plugins}.`);
    }
  }

  /**
   * Load middleware into memory.  The system provides three variables
   * to middleware, socket, data, and scope.  See the commands directory
   * for more practical examples.
   * @param {object} middleware  The middleware we want to load.
   */
  use(middleware) {
    try {
      require(middleware)(this);
      return true;
    } catch (error) {
      return false;
    }
  }
};
