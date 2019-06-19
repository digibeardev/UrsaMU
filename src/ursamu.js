const { EventEmitter } = require("events");

module.exports = class UrsaMu extends EventEmitter {
  constructor(options = {}) {
    super(options);
    const { plugins } = options;
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
          console.error(`ERROR: ${error}`);
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
};
