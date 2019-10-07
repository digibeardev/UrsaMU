const moment = require("moment");
const { has } = require("lodash");

module.exports = parser => {
  parser.funs.set("dbref", async (en, args, scope) => {
    const key = await parser.run(en, args[0], scope);
    en = await parser.db.key(en);
    let tar = await parser.db.get(key);
    tar = tar[0];
    if (tar) {
      return "#" + tar._key;
    } else {
      return "#-1 CAN'T FIND OBJECT";
    }
  });

  parser.funs.set("name", async (en, args, scope) => {
    try {
      const name = await parser.evaluate(en, args[0], scope, { parse: true });
      en = await parser.db.key(en);
      let tar = await parser.db.get(name);

      if (Array.isArray(tar)) {
        tar = tar[0] || false;
      }

      if (tar) {
        tar.name = tar.name.split(";")[0];

        if (await parser.flags.canEdit(en, tar)) {
          return `${
            tar.moniker ? tar.moniker : tar.name
          }${await parser.flags.flagCodes(tar)}`;
        } else {
          return `${tar.moniker ? tar.moniker : tar.name}`;
        }
      } else {
        throw new Error("#-1 CAN'T FIND THAT ITEM");
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
    let tar = await parser.db.get(await parser.evaluate(en, args[0], scope));
    if (Array.isArray(tar)) {
      tar = tar[0];
    }

    if (tar) {
      const socket = parser.queues.sockets.get(tar._key);
      if (socket) {
        const idleEpoch = parser.queues.sockets.get(tar._key).timestamp;
        let d = new Date(0);
        d.setUTCSeconds(idleEpoch);
        const idle = moment(d.toUTCString());
        const now = moment(Date.now());
        return idle.from(now, true);
      } else {
        return "#-2 NOT CONNECTED";
      }
    } else {
      return "#-1 TARGET NOT FOUND";
    }
  });

  parser.funs.set("lcon", async (en, args, scope) => {
    let tar = await parser.evaluate(en, args[0], scope);
    en = await parser.db.key(en);
    let type = args[1] ? await parser.evaluate(en, args[1], scope) : "";
    type == type.toLowerCase();
    curRoom = await parser.db.key(en.location);

    // Check for target.
    if (tar.toLowerCase() === "me") {
      tar = en;
    } else if (tar.toLowerCase() === "here") {
      tar = curRoom;
    } else {
      tar = await parser.db.get(tar);
      if (Array.isArray(tar)) {
        tar = tar[0];
      }
      if (!parser.flags.canEdit(en, tar)) {
        return "#-1 Permission denied.";
      }
    }

    let contents = [];
    // get db objects for target contents.
    for (let item of tar.contents) {
      item = await parser.db.key(item);
      contents.push(item);
    }

    // if A 'type' is targeted, return objects of that type.
    // players are checked for connected status first.
    // TODO Add support for dark flag
    if (tar._key) {
      let items = [];

      if (type === "things" || type === "thing") {
        items = contents.filter(item => (item.type === "thing" ? true : false));
      } else if (type === "players" || type === "player") {
        items = contents.filter(item =>
          item.type === "player" ? true : false
        );
      } else {
        items = contents;
      }

      const filtered = [];
      // Filter out not connected (and dark) players (And dark objects too)
      for (const obj of items) {
        if (
          (obj.type === "player" &&
            (await parser.flags.hasFlags(obj, "connected"))) ||
          obj.type === "thing"
        ) {
          filtered.push(obj);
        }
      }

      return filtered.map(item => "#" + item._key).join(" ");
    } else {
      return "#-2 I CAN'T FIND THAT OBJECT.";
    }
  });

  parser.funs.set("lexits", async (en, args, scope) => {
    let tar = await parser.evaluate(en, args[0], scope);
    en = await parser.db.key(en);
    curRoom = await parser.db.key(en.location);

    // Check for target.
    if (tar.toLowerCase() === "me") {
      tar = en;
    } else if (tar.toLowerCase() === "here" || tar._key === en.location) {
      tar = curRoom;
    } else {
      tar = await parser.db.get(tar);
      if (Array.isArray(tar)) {
        tar = tar[0];
      }
      if (!parser.flags.canEdit(en, tar)) {
        return "#-1 Permission denied.";
      }
    }

    const exits = [];
    // Get targets exits
    for (let item of tar.exits) {
      item = await parser.db.key(item);
      exits.push(item);
    }

    return exits.map(exit => `#${exit._key}`).join(" ");
  });

  parser.funs.set("hasflag", async (en, args, scope) => {
    en = await parser.db.key(en);
    let tar = await parser.evaluate(en, args[0], scope);
    let flag = await parser.evaluate(en, args[1], scope);

    // Check for target.
    if (tar.toLowerCase() === "me") {
      tar = en;
    } else if (tar.toLowerCase() === "here") {
      tar = curRoom;
    } else {
      tar = await parser.db.get(tar);
      if (Array.isArray(tar)) {
        tar = tar[0];
      }
    }

    if (args.length !== 2) {
      return "#-1 HASFLAG REQUIRES 2 ARGUMENTS";
    }

    return (await parser.flags.hasFlags(tar, flag)) ? "1" : "0";
  });
};
