const fs = require("fs");
const { log } = require("./utilities");

class Config {
  constructor() {
    try {
      this.config = require("../data/config.json");
      log.success("Configuration file loaded.");
    } catch {
      log.warning("No config file found. Creating one.");
      this.config = {
        name: "UrsaMU",
        telnet: 2000,
        ws: 3000,
        startingRoom: 1
      };
      this.save();
      log.success("Configuration file made.", 2);
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
