moment = require("moment");
const { db } = require("../../mushCore/database");

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
            "%cr---%cn[ljust(%ch%cr<<%cn %chCharacters %cr>>%cn,75,%cr-%cn)]" +
            "[ljust(%r%ch%cuName%cn,25)][ljust(%ch%cuIdle%cn,15)]%cn %ch%cuShort-Desc%cn";
          const players = await playerCursor.all();
          for (const player of players) {
            output += `%r${await mush.name(en, player)}`
              .padEnd(26)
              .substring(0, 26);
            output += `${await idleTime(player)}`.padEnd(16);
            output += `${
              mush.attrs.get(await mush.db.key(player._key), "short-desc")
                ? mush.attrs.get(await mush.db.key(player.key), "short-desc")
                    .value
                : "%ch%cxType %cn&short-desc me=<desc>%ch%cx to set.%cn"
            }`;
          }
          if (objCursor.hasNext()) {
            output +=
              "%r%cr---%cn[ljust(%ch%cr<<%cn %chObjects %cr>>%cn,75,%cr-%cn)]";
            for (obj of objCursor) {
              output += `%r${await mush.name(en, obj)}`;
            }
          }
        } else {
          output = tar.type === "player" ? "\nCarrying:" : "\nContents:";
          tar.contents.forEach(async item => {
            const tarCursor = await mush.db.key(item._key);
            const tar = await tarCursor.next()(
              (output += `%r${await mush.name(en, tar)}`)
            );
          });
        }

        return output;
      };

      // Format exits for display.
      const exits = async (en, tar) => {
        const exitCursor = await db.query(`
          FOR obj IN objects
            FILTER obj.type == "exit" && obj.location == "${tar._key}"
            RETURN obj
        `);

        let tars;
        const exits = [];
        if (exitCursor.hasNext()) {
          for (exit of exitCursor) {
            exits.push(exit.name.slice(";")[0].trim());
          }
          let exitsList = exits.join("|");

          tars =
            `%r%cr---%cn[ljust(%ch%cr<<%cn %chExits %cr>>%cn,75,%cr-%cn)]%r` +
            `[columns(${exitsList},26,|)]`;
        }
        return tars;
      };

      // Figure out enactor and target information.

      let enactor = await mush.db.key(socket._key);
      let target = await mush.db.get(match[1]);

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
      }

      // If target doesn't have a value at this point, the object probably
      // doesn't exist.
      if (!target) {
        mush.broadcast.send(socket, "I can't find that here.");
      } else {
        (async () => {
          let desc = "";
          // Send the built description to the enactor.
          desc += (await mush.name(enactor, target)) + "\n";
          desc += "%r%t" + (await description(enactor, target)) + "%r%r";
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
