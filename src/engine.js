const parser = require("./parser");
const emitter = require("./emitter");
const broadcast = require("./broadcast");
const db = require("./database");
const grid = require("./grid");
const flags = require("./flags");
const config = require("./config");
const help = require("./help");

module.exports = class UrsaMu {
  constructor(options = {}) {
    const { plugins } = options;
    this.parser = parser;
    this.broadcast = broadcast;
    this.emitter = emitter;
    this.cmds = new Map();
    this.txt = new Map();
    this.scope = {};
    this.log = require("./utilities").log;
    this.db = db;
    this.grid = grid;
    this.flags = flags;
    this.config = config;
    this.sockets = new Set();
    this.pQueue = [];
    this.plugins = plugins;
    this.help = help;

    // Initialize in-game functionality.
    this.init();
  }

  init() {
    // Install in-game commands, functions, and pre-load
    // text files.

    require("./commands")(this);
    require("../text")(this);
    require("./exec")(this);
    require("./gameTimers")(this);

    // Run plugins if present.
    if (this.plugins) {
      this.plugin(this.plugins);
    }
  }

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

          console.log(`SUCESS: Plugin installed: ${plugin}.`);
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
