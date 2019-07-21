module.exports = class UrsaMu {
  constructor(options = {}) {
    const { plugins } = options;
    this.parser = require("./parser");
    this.broadcast = require("./broadcast");
    this.cmds = new Map();
    this.txt = new Map();
    this.scope = {};
    this.db = require("./database");
    this.grid = require("./grid");
    this.flags = require("./flags");
    this.sockets = new Set();
    this.queue = require("mu-queue");
    this.config = require("../data/config.json");
    this.plugins = plugins;
    this.help = require("./help");

    // Initialize in-game functionality.
    this.init();
  }

  init() {
    // Install in-game commands, functions, and pre-load
    // text files.

    require("./commands")(this);
    require("../text")(this);
    require("./exec")(this);

    // Run plugins if present.
    if (this.plugins) {
      this.plugin(this.plugins);
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
