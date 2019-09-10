const chalk = require("chalk");
const { readdirSync } = require("fs");
const shajs = require("sha.js");

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

  info(message, space = 0) {
    console.log(
      `${"\xa0".repeat(space)}${chalk.blue("\u2139")} INFO: ${message}`
    );
  }

  error(message, space = 0) {
    console.log(
      `${"\xa0".repeat(space)}${chalk.red("\u2716")} ERROR: ${
        message.stack ? message.stack : message
      }`
    );
  }
}

module.exports.log = new Log();

module.exports.sha256 = string => {
  return shajs("sha256")
    .update(string.trim())
    .digest("hex");
};
