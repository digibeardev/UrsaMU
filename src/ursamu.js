const broadcast = require("./broadcast");

module.exports = class UrsaMu {
  constructor(options = {}) {
    const { plugins } = options;
    this.broadcast = broadcast;
    // Check for plugins
    if (plugins) this.plugin(plugins);
  }

  // Check for plugins
  plugin(plugins) {
    // if plugins is an array, process the array.
    if (Array.isArray(plugins)) {
      plugins.forEach(plugin => {
        try {
          require(plugin)(this);
        } catch (error) {
          console.error(`ERROR: Could not import plugin: ${plugin}`);
          console.error(`ERROR: ${error.stack}`);
        }
      });

      // If it's a string, process the string.
    } else if (typeof plugins === "string") {
      try {
        require(plugins)(this);
      } catch (error) {
        console.error(`ERROR: Could not import plugin: ${plugins}`);
        console.error(`ERROR: ${error}`);
      }

      // Else it's not a format the plugin system can read.
    } else {
      console.error(`ERROR: Unable to read plugin: ${plugins}.`);
    }
  }

  // Link different types of servers to the system!
  serve(middleware, options = {}) {
    // The middleware is a function, run it.
    if (typeof middleware === "function") {
      return middleware(options);
    }
  }
};
