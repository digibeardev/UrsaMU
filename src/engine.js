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
const useraccts = require("./userAccts");
const channels = require("./channels");
const utilities = require("./utilities");

module.exports = class UrsaMu {
  constructor(options = {}) {
    const { plugins } = options;
    this.attrs = attrs;
    this.accounts = useraccts;
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
    this.sha256 = utilities.sha256;
    this.channels = channels;

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

    try {
      require("./commands")(this);
      this.log.success("Commands loaded.");
    } catch (error) {
      this.log.error(`Unable to load commands. Error: ${error}`);
    }

    try {
      require("../text")(this);
      this.log.success("Text files loaded.");
    } catch (error) {
      this.log.error(`Unable to load text files. Error: ${error}`);
    }

    try {
      require("./exec")(this);
      this.log.success("Command parser loaded.");
    } catch (error) {
      this.log.error(`Unable to load command parser. Error: ${error}`);
    }

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

    this.emitter.on("channel", (chan, msg) => {
      this.queues.sockets.forEach(socket => {
        const target = this.db.id(socket.id);

        // loop through each channel, and see if there's a match.
        for (const channel of target.channels) {
          if (channel.name == chan.name && channel.status) {
            let header = "";
            header += chan.moniker ? chan.moniker : `%ch<${chan.name}>%cn`;
            // I would check to make sure the stream is writable first, but the library
            // I'm using for telnet at the moment doesn't pass that information up the
            // chain by default.  We may need a custom telnet module later.  Fun!
            try {
              this.broadcast.send(socket, `${header} ${msg}`);
            } catch {}
          }
        }
      });
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
};
