const fs = "fs";
const config = require("../data/config.json");
const { log } = require("./utilities");

class Config {
  constructor() {
    try {
      this.config = JSON.stringify(
        fs.readFileSync("../data/config.json", "utf-8")
      );
      log.success("Configuration file loaded");
    } catch {
      log.error("Unable to load configuration file.");
      this.config = {};
    }
  }

  get(name) {
    return this.config[name];
  }

  set(settings) {
    this.config = { ...this.config, ...settings };
    return this.config;
  }

  save() {
    try {
      fs.writeFileSync("./data/config.json", JSON.stringify(this.config));
    } catch {
      log.error("Unable to save configuration fille.");
    }
  }
}

module.exports = new Config();
