const fs = require("fs");
const { log } = require("./utilities");

class Config {
  constructor() {
    this.config = require("../data/config.json");
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
      fs.writeFileSync(
        "./data/config.json",
        JSON.stringify(this.config, {}, 2)
      );
    } catch {
      log.error("Unable to save configuration fille.");
    }
  }
}

module.exports = new Config();
