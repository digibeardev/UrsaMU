const chalk = require("chalk");

/**
 * Log Formatting.
 */
class Log {
  success(message) {
    console.log(`${chalk.green("\u2714")} SUCCESS: ${message}`);
  }

  error(message) {
    console.log(`${chalk.red("\u2716")} ERROR: ${message}`);
  }
}

module.exports.log = new Log();
