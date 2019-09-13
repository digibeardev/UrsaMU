const fs = require("fs");
const { resolve } = require("path");
const { log } = require("../utilities");
const { config } = require("./defaults");
const { get, set } = require("lodash");
class Config {
  constructor() {
    try {
      this.config = require("../../Data/config.json");
      log.success("Configuration file loaded.");
    } catch {
      log.warning("No config file found. Creating one.");
      this.config = config;
      this.save();
      log.success("Configuration file made.", 2);
    }
  }

  get(path) {
    return get(this.config, path);
  }

  set(path, setting) {
    return set(this.config, path, setting);
  }

  save() {
    try {
      fs.writeFileSync(
        resolve(__dirname, "../../Data/config.json"),
        JSON.stringify(this.config, {}, 2)
      );
    } catch (error) {
      log.error(error);
    }
  }
}

module.exports = new Config();
