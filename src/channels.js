const { readFileSync, writeFileSync } = require("fs");
const { resolve } = require("path");
const { log } = require("./utilities");
const { find } = require("lodash");
const emitter = require("./emitter");

class Channels {
  constructor() {
    this.channels = [];
    try {
      this.channels = JSON.parse(
        readFileSync(resolve(__dirname, "../data/channels.json"), "utf-8")
      );
    } catch (error) {
      log.error("Unable to read channel database.  Error: " + error);
      log.warning("Creating new Database.");
      this.channels = [
        {
          name: "Public",
          see: "",
          join: "",
          talk: "",
          mod: "immortal wizard royalty"
        },
        {
          name: "Newbie",
          see: "",
          join: "",
          talk: "",
          mod: "immortal wizard royalty"
        },
        {
          name: "Staff",
          see: "immortal wizard royalty",
          join: "immortal wizard royalty",
          talk: "immortal wizard royalty",
          mod: "immortal wizard"
        }
      ];
      this.save();
    }
  }

  save() {
    try {
      writeFileSync(
        resolve(__dirname, "../data/channels.json"),
        JSON.stringify(this.channels)
      );
    } catch (error) {
      log.error(`Unable to save channel database.  Error: ${error}`);
    }
  }

  get(channel) {
    return find(this.channels, { name: channel });
  }

  broadcast(socket, channel, string) {
    // See if the channel exists, and grab a copy of it's stats:
    const chan = this.get(channel);
    if (chan) {
      emitter.emit("channel", socket, channel, message);
    }
  }
}

module.exports = new Channels();
