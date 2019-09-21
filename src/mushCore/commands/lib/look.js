moment = require("moment");
const { db } = require("../../database");

module.exports = mush => {
  mush.cmds.set("look", {
    pattern: /^[look]+\s+?(.*)?/i,
    restriction: "connected",
    run: async (socket, match) => {
      // Set a couple of function expressions to help build
      // object descriptions.

      const description = (en, tar) => {
        return tar.description;
      };

      const idleTime = player => {
        const idleEpoch = mush.queues.keyToSocket(player._key).timestamp;
        let d = new Date(0);
        d.setUTCSeconds(idleEpoch);
        const idle = moment(d.toUTCString());
        const now = moment(Date.now());
        return idle.from(now, true);
      };

      // Format contents for display
      const contents = async (en, tar) => {
        try {
          const playerCursor = await db.query(`
          FOR obj in objects
            FILTER obj.type == "player" && obj.location == "${tar._key}"
            RETURN obj  
        `);

          const objCursor = await db.query(`
          FOR obj in objects
            FILTER obj.type == "thing" && obj.location == "${tar._key}"
            RETURN obj
        `);

          let output = "";

          if (en.location === tar._key) {
            output =
              "%r%cr---%cn[ljust(%ch%cr<<%cn %chCharacters %cr>>%cn,75,%cr-%cn)]" +
              "[ljust(%r%ch%cuName%cn,25)][ljust(%ch%cuIdle%cn,15)]%cn %ch%cuShort-Desc%cn";
            const players = await playerCursor.all();
            for (const player of players) {
              if (await mush.flags.hasFlags(player, "connected")) {
                output += `%r${await mush.name(en, player)}`
                  .padEnd(26)
                  .substring(0, 26);
                output += `${await idleTime(player)}`.padEnd(16);
                output += `${
                  (await mush.attrs.get(
                    await mush.db.key(player._key),
                    "short-desc"
                  ))
                    ? await mush.attrs.get(
                        await mush.db.key(player._key),
                        "short-desc"
                      )
                    : "%ch%cxType %cn&short-desc me=<desc>%ch%cx to set.%cn"
                }`;
              }
            }
            if (objCursor.hasNext()) {
              const objects = await objCursor.all();
              output +=
                "%r%cr---%cn[ljust(%ch%cr<<%cn %chObjects %cr>>%cn,75,%cr-%cn)]";
              for (obj of objects) {
                output += `%r${await mush.name(en, obj)}`;
              }
            }
          } else {
            output = tar.type === "player" ? "\nCarrying:" : "\nContents:";
            for (const item of tar.contents) {
              const itm = await mush.db.key(item);
              output += `%r${await mush.name(en, itm)}`;
            }
          }

          return output;
        } catch (error) {
          mush.log.error(error);
        }
      };

      // Format exits for display.
      const exits = async (en, tar) => {
        let tars;
        const exits = [];

        for (let exit of tar.exits) {
          exit = await mush.db.key(exit);
          if (exit.type == "exit") {
            exits.push(exit.name.split(";")[0].trim());
          }
        }
        const exitsList = exits.join("|");

        if (exits.length > 0) {
          tars =
            `%r%cr---%cn[ljust(%ch%cr<<%cn %chExits %cr>>%cn,75,%cr-%cn)]%r` +
            `[columns(${exitsList},26,|)]`;
        }
        return tars;
      };

      // Figure out enactor and target information.
      // TODO Fix looking at other objects.
      let enactor = await mush.db.key(socket._key);
      let target = await mush.db.get(match[1]);
      let curRoom = await mush.db.key(enactor.location);

      if (!match[1]) {
        target = await mush.db.key(enactor.location);
      }

      if (typeof match[1] === "string" && match[1].toLowerCase() === "me") {
        target = enactor;
      } else if (
        typeof match[1] === "string" &&
        match[1].toLowerCase() == "here"
      ) {
        target = await mush.db.key(enactor.location);
      } else if (!match[1]) {
        target = await mush.db.key(enactor.location);
      } else if (
        (target[0] && target[0].location === enactor._key) ||
        (target[0] && target[0].location === curRoom._key)
      ) {
        target = target[0];
      }

      // If target doesn't have a value at this point, the object probably
      // doesn't exist.
      if (!target || target.length <= 0) {
        mush.broadcast.send(socket, "I can't find that here.");
      } else {
        (async () => {
          let desc = "";
          // Send the built description to the enactor.
          desc += (await mush.name(enactor, target)) + "\n";
          desc += "%r" + (await description(enactor, target)) + "%r";

          if (target.contents.length > 0) {
            desc += await contents(enactor, target);
          }
          if (await exits(enactor, target)) {
            desc += await exits(enactor, target);
          }
          if (enactor.location === target._key) {
            desc += `%r[rjust(%ch%cr<<%cn %ch${
              (await mush.flags.hasFlags(target, "ic")) ? "IC" : "OOC"
            } %cr>>%cn,75,%cr-%cn)]%cr---%cn`;
          }
          mush.broadcast.send(
            socket,
            mush.parser.run(desc, {
              "%0": await mush.name(enactor, target, true)
            })
          );
        })().catch(error => mush.log.error(error));
      }
    }
  });
};
