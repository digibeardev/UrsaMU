const moment = require("moment");

module.exports = parser => {
  parser.funs.set("dbref", async (en, args) => {
    en = await parser.db.key(en);
    let tar = await parser.db.get(args[0]);
    tar = tar[0];
    if (tar) {
      return "#" + tar._key;
    } else {
      return "#-1 CAN'T FIND OBJECT";
    }
  });

  parser.funs.set("name", async (en, args) => {
    try {
      en = await parser.db.key(en);
      let tar = await parser.db.get(args[0]);

      if (Array.isArray(tar)) {
        tar = tar[0] || false;
      }

      if (tar) {
        if (await parser.flags.canEdit(en, tar)) {
          return `${
            tar.moniker ? tar.moniker : tar.name
          }${await parser.flags.flagCodes(tar)}`;
        } else {
          return `${tar.moniker ? tar.moniker : tar.name}`;
        }
      } else {
        return "#-1 CAN'T FIND OBJECT";
      }
    } catch (error) {
      parser.log.error(error);
    }
  });

  parser.funs.set("stat", async (en, args, scope) => {
    if (args.length < 2) "#-1 STATS REQUIRES 2 ARGS";
    const enactor = await parser.db.key(en);
    let tar = await parser.db.get(args[0]);
    if (Array.isArray(tar)) {
      tar = tar[0];
    }
    if (
      await parser.flags
        .canEdit(enactor, tar)
        .catch(error => `#-1 ${error.toString().toUpperCase()}`)
    ) {
      return await parser.stats
        .value(tar, args[1])
        .catch(error => `#-2 ${error.toString().toUpperCase()}`);
    }
  });

  parser.funs.set("u", async (en, args, scope) => {
    const [data, ...rest] = args;
    const [key, attr] = data.split("/");
    const enactor = await parser.db.key(en).catch(error => `#-1 ${error}`);
    const tar = await parser.db.key(key).catch(error => `#-2 ${error}`);
    const expr = parser.attrs.get(tar, attr);
    const localScope = {};

    if (parser.flags.canEdit(enactor, tar)) {
      if (expr) {
        // Fill out the local scope (%0, %1, %2, etc subs.)
        for (const arg of rest) {
          const index = rest.indexOf(arg);
          localScope["%" + index] = arg;
        }

        return await parser
          .evaluate(en, parser.parse(expr), { ...localScope, ...scope })
          .catch(error => `#-2 ${error}`);
      } else {
        return "#-1 CAN'T FIND THAT ATTRIBUTE";
      }
    } else {
      return "#-2 PERMISSION DENIED";
    }
  });

  parser.funs.set("idle", async (en, args, scope) => {
    let tar = await parser.db.get(args[0]);
    if (Array.isArray(tar)) {
      tar = tar[0];
    }

    if (tar) {
      const socket = parser.queues.sockets.get(tar._key);
      if (socket) {
        let d = new Date(0);
        d.setUTCSeconds(socket.timestamp);
        const idle = moment(d.toUTCString());
        const now = moment(Date.now());
        const duration = moment.duration(now.diff(idle, "seconds"));
        const durObj = duration._data;
        const { seconds, minutes, hours, days, months } = durObj;
        let output = "0s";

        // figure out display
        if (seconds) {
          output = `${seconds}s`;
        }

        if (minutes) {
          output = `${minutes}m ${seconds}s`;
        }

        if (hours) {
          output = `${hours}h ${minutes}m`;
        }

        if (days) {
          output = `${days}d ${hours}h`;
        }

        if (months) {
          output = `${months}m ${days}d`;
        }
        return output;
      } else {
        return "#-2 NOT CONNECTED";
      }
    } else {
      return "#-1 TARGET NOT FOUND";
    }
  });
};
