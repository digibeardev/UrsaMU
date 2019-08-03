const chalk = require("chalk");

/**
 * Log Formatting.
 */
class Log {
  success(message, space = 0) {
    console.log(
      `${"\xa0".repeat(space)}${chalk.green("\u2714")} SUCCESS: ${message}`
    );
  }

  warning(message, space = 0) {
    console.log(
      `${"\xa0".repeat(space)}${chalk.yellow("\u26A0")} WARNING: ${message}`
    );
  }

  error(message, space = 0) {
    console.log(
      `${"\xa0".repeat(space)}${chalk.red("\u2716")} ERROR: ${message}`
    );
  }
}

module.exports.log = new Log();
