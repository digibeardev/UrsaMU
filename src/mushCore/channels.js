const { db } = require("./database");
const { log } = require("../utilities");
const emitter = require("./emitter");
const { channels } = require("./defaults");

const chanData = db.collection("channels");

class Channels {
  async init() {
    try {
      const chanCursor = await db.query(`RETURN LENGTH(channels)`);
      if ((await chanCursor.next()) === 0) {
        log.warning("Creating new channel database.");
        for (const channel of channels) {
          const queryCursor = await db.query(`
            FOR chan IN channels
              FILTER chan.name == "${channel}"
              RETURN chan
          `);

          if (!queryCursor.hasNext()) {
            try {
              channel.name = channel.name.toLowerCase();
              channel.see = channel.see || "";
              channel.join = channel.join || "";
              channel.talk = channel.talk || "";
              channel.mod = channel.mod || "immortal|wizard|royalty|staff";
              channel.owner = channel.owner || "";
              channel.header = channel.header || "";
              const chan = await chanData.save(channel);
              if (chan) {
                log.success(`Channel: ${channel.name} added.`);
              } else {
                log.error(
                  `Unable to add channel ${channel.name}. Error: ${error}`
                );
              }
            } catch (error) {
              log(error);
            }
          }
        }
      } else {
        log.success("Channels loaded.");
      }
    } catch (error) {
      log.error("Unable to read channel database.  Error: " + error);
    }
  }

  async get(channel) {
    const chanCursor = await db.query(`
      FOR chan in channels
        FILTER chan.name == "${channel.toLowerCase()}"
        RETURN chan
      `);
    return chanCursor.next();
  }

  async broadcast(socket, channel, string) {
    // See if the channel exists, and grab a copy of it's stats:
    const chan = await this.get(channel);
    if (chan) {
      emitter.emit("channel", socket, channel, string);
    }
  }
}

module.exports = new Channels();
