const { get, set } = require("lodash");

module.exports = mush => {
  mush.cmds.set("@stat/set", {
    pattern: /^@?stat\/set\s(.*)\/(.*)\s?=\s?(.*)/i,
    restriction: "connected immortal|wizard",
    run: async (socket, data) => {
      try {
        let target = data[1].trim();
        const enactor = await mush.db.key(socket._key);
        const curRoom = await mush.db.key(enactor.location);

        // Figure out the target.
        // Really bad mutation black magic. Fix at some point.
        if (target.toLowerCase() === "me") {
          target = enactor;
        } else if (target.toLowerCase() === "here") {
          target = curRoom;
        } else {
          target = await mush.db.get(target);
          target = target[0];
        }

        let stat = data[2].trim();
        let val = data[3].trim();
        const statObj = await mush.stats.get(target, stat);
        // Do we have a target object?
        if (target._key) {
          if (statObj) {
            const { err, stats } = await mush.stats.set(target, stat, val);
            if (err) mush.log.error(err);
            if (stats) {
              mush.broadcast.send(
                socket,
                `%chDone%cn. ${
                  target.moniker ? target.monker : "%ch" + target.name + "%xh"
                }'s '%ch${stat}%cn' has been set to '%ch${val}%cn'.`
              );
            }
          } else {
            mush.broadcast.send(socket, `That's not a proper stat.`);
          }
        } else {
          mush.broadcast.send(socket, "I can't find that.");
        }
      } catch (error) {
        mush.log.error(error);
      }
    }
  });

  mush.cmds.set("@stats/get", {
    pattern: /^@?stat\/get\s+(.*)\/(.*)/i,
    restriction: "connected immortal|wizard|royalty",
    run: async (socket, data) => {
      const enactor = await mush.db.key(socket._key);
      let target = data[1].trim();
      // Figure out the target.
      // Really bad mutation black magic. Fix at some point.
      if (target.toLowerCase() === "me") {
        target = enactor;
      } else if (target.toLowerCase() === "here") {
        target = curRoom;
      } else {
        target = await mush.db.get(target);
        target = target[0];
      }

      if (target) {
        let results = await mush.stats.value(target, data[2]);
        if (results) {
          mush.broadcast.send(
            socket,
            `%chGAME>>%cn ${
              target.moniker ? target.monker : target.name
            }'s '%ch${data[2].trim()}%cn' is '%ch${results}%ch'.`
          );
        } else {
          mush.broadcast.send(socket, "I don't understand that stat.");
        }
      } else {
        mush.broadcast.send(socket, "I can't find that.");
      }
    }
  });

  mush.cmds.set("@stats", {
    pattern: /^@?stats/i,
    restriction: "connected immortal|wizard|Royalty",
    run: async socket => {
      let list = "";
      let output =
        "%cr---%cn[ljust(%ch%cr<<%cn %ch@Stats List %cr>>%Cn,75,%cr-%cn)]";
      for (const cat of mush.stats.models.keys()) {
        keys = Array.from(mush.stats.stats.keys());
        output += `%r%r%ch%cu${cat.toUpperCase()}(${keys.length})%cn`;
        for (const key of keys) {
          if (mush.stats.stats.get(key).model === cat) {
            list += " " + key;
          }
        }
        output += `%r[columns(${list.trim()},4)]%r%r`;
        output += `Type '%ch@stat/info <stat>%cn' for more information.%r`;
        output += `[repeat(%cr-%cn,78)]`;
      }
      mush.broadcast.send(socket, output);
    }
  });

  mush.cmds.set("@stat/info", {
    pattern: /^@?stat\/info\s+(.*)/i,
    restriction: "connected immortal|wizard|royalty",
    run: async (socket, data) => {
      let output = "";
      let stat = await mush.stats.stats.get(data[1]);
      if (stat) {
        output += `[ljust(%chName%cn,sub(39,${data[1].length}),.)]%ch${
          data[1]
        }%cn%r`;
        output += `[ljust(%chKey%cn,sub(39,${stat._key.length}),.)]%ch${stat._key}%cn%r`;
        output += `[ljust(%chModel%cn,sub(39,${stat.model.length}),.)]%ch${stat.model}%cn%r`;
        if (stat.example) {
          output += `[ljust(%chExample%cn,sub(39,${stat.example.length}),.)]%ch${stat.example}%cn%r`;
        }
        if (stat.description) {
          output += `%r%ch${stat.description}%cn%r`;
        }

        delete stat.model;
        delete stat.description;
        delete stat.example;
        delete stat._id;
        delete stat._rev;
        delete stat.name;
        delete stat._key;
        delete stat.value;
        output += "%r%ch%cuDefaults%cn";
        for (const prop in stat) {
          output += `%r[ljust(${prop},sub(39,${
            stat[prop].toString().length
          }),.)]%ch${stat[prop]}%cn`;
        }
        mush.broadcast.send(socket, output);
      } else {
        mush.broadcast.send(socket, "I can't find that stat.");
      }
    }
  });
};
