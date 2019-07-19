const broadcast = require("./broadcast");
const database = require("./database");
const muQueue = require("mu-queue");
const help = require("./help");

module.exports = class UrsaMu {
  constructor(options = {}) {
    const { plugins } = options;

    this.parser = require("./parser")(this);
    this.broadcast = broadcast;
    this.funs = new Map();
    this.cmds = new Map();
    this.sub = new Map();
    this.txt = new Map();
    this.scope = {};
    this.db = database;
    this.sockets = [];
    this.queue = muQueue;
    this.config = require("../data/config.json");
    this.plugins = plugins;
    this.help = help;

    // Initialize in-game functionality.
    this.init();
  }

  init() {
    // Install in-game commands, functions, and pre-load
    // text files.
    require("./commands")(this);
    require("./functions")(this);
    require("../text")(this);

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
