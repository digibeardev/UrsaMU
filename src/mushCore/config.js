const fs = require("fs");
const { log } = require("../utilities");

class Config {
  constructor() {
    try {
      this.config = require("../../Data/config.json");
      log.success("Configuration file loaded.");
    } catch {
      log.warning("No config file found. Creating one.");
      this.config = {
        name: "UrsaMU",
        connections: {
          telnet: 2000,
          ws: 3000
        },
        database: {
          url: "http://127.0.0.1:8529/",
          username: "root",
          password: "",
          database: "ursamu"
        },
        startingRoom: "1"
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
      log.error("Unable to save configuration file.");
    }
  }
}

module.exports = new Config();
