const { get, set } = require("lodash");

module.exports = mush => {
  const getStats = async () => {
    let statQuery = await mush.query.query(`
        FOR stat IN stats
        RETURN stat`);
    return await statQuery.all();
  };

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
          if (statObj || statObj === 0) {
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
            }'s '%ch${mush.capstring(
              data[2].trim(),
              "title"
            )}%cn' is '%ch${results}%ch'.`
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
      let stats = await getStats();
      let output = "[lheader(@stats List)]%r%r";
      for (const cat of mush.stats.models.keys()) {
        let list = stats.filter(stat =>
          stat.model === cat ? stat.name : false
        );
        list = list.map(stat => stat.name);
        output += `%ch%cu${cat.toUpperCase()}(${list.length})%cn`;
        output += `%r[columns(${list.sort().join("|")},4,,|)]%r%r`;
      }
      output += `Type '%ch@stat/info <stat>%cn' for more information.%r`;
      output += `[footer()]`;
      mush.broadcast.send(socket, output);
    }
  });

  mush.cmds.set("@stat/info", {
    pattern: /^@?stat\/info\s+(.*)/i,
    restriction: "connected immortal|wizard|royalty",
    run: async (socket, data) => {
      let output = "";
      const name = mush.capstring(data[1].trim(), "title");
      let statQuery = await mush.query.query(`
        FOR stat IN stats
        RETURN stat`);
      statQuery = await statQuery.all();
      const stat = statQuery.filter(stat =>
        stat.name === name ? stat : false
      )[0];
      let statCopy = new Object({ ...stat });
      if (statCopy) {
        output += `%cr---%cn[ljust(%ch%cr<<%cn %ch@stat/info ${statCopy.name}%(#${statCopy._key}%) %cr>>%cn,75,%cr-%cn)]%r`;
        if (statCopy.description) {
          output += `%r%ch${statCopy.description}%cn%r%r`;
        }
        output += `[ljust(%chModel%cn,sub(39,${
          statCopy.model.length
        }),.)]%ch${mush.capstring(statCopy.model, "title")}%cn%r`;
        if (stat.example) {
          output += `[ljust(%chExample%cn,sub(39,${statCopy.example.length}),.)]%ch${statCopy.example}%cn%r`;
        }

        delete statCopy.model;
        delete statCopy.description;
        delete statCopy.example;
        delete statCopy._id;
        delete statCopy._rev;
        delete statCopy.name;
        delete statCopy._key;
        delete statCopy.value;
        delete statCopy.ignore;

        output += "%r%ch%cuDefaults%cn";
        for (const prop in statCopy) {
          output += `%r[ljust(${prop},sub(39,${
            statCopy[prop].toString().length
          }),.)]%ch${mush.capstring(statCopy[prop].toString(), "title")}%cn`;
        }
        output += `%r%r[repeat(%cr-%cn,78)]`;
        mush.broadcast.send(socket, output);
      } else {
        mush.broadcast.send(socket, "I can't find that stat.");
      }
    }
  });

  mush.cmds.set("@stat/add", {
    pattern: /^@?stat\/add (.*)\s?=\s?(.*)/i,
    restriction: "connected immortal|wizard",
    run: async (socket, data) => {
      const name = mush.capstring(data[2].trim(), "title");
      const model = data[1].trim().toLowerCase();
      // Make sure an existing model is being called.
      if (mush.stats.models.has(model)) {
        // Make sure the stat doesn't already exist.
        if (!mush.stats.stats.has(name)) {
          const { added } = await mush.stats.add([{ name, model }]);
          if (added.length > 0) {
            mush.broadcast.send(
              socket,
              `%chDone>>%cn. ${mush.capstring(
                model,
                "title"
              )} '%ch${name}%cn' has been added.`
            );
            mush.exe(socket, "@stat/info", [, `${name}`]);
          } else {
            mush.broadcast.send(socket, "There was an error saving your stat.");
          }
        } else {
          mush.broadcast.send(socket, "That stat already exists.");
        }
      } else {
        mush.broadcast.send(socket, "That's not a good model.");
      }
    }
  });

  mush.cmds.set("@stat/update", {
    pattern: /@?stat\/update\s+(.*)\s?=\s?(.*)/i,
    restriction: "connected immortal|wizard|royalty",
    run: async (socket, data) => {
      const path = data[1].trim();
      const parts = path.split(".");
      const { error: err, results: res } = await mush.stats.update(
        path,
        data[2].trim()
      );
      if (err) mush.broadcast.error(err);
      if (res) {
        mush.broadcast.send(
          socket,
          `%chDone.%cn Stat '%ch${path}%cn' updated to '%ch${data[2].trim()}%cn'.`
        );
        mush.exe(socket, "@stat/info", [null, parts[0]]);
      } else {
        mush.broadcast.send(socket, "That's not a good stat.");
      }
    }
  });

  mush.cmds.set("@stat/remove", {
    pattern: /^@?stat\/remove\s+(.*)/,
    restriction: "connected immortal|wizard",
    run: async (socket, data) => {
      // Delete the local reference
      // delete the database reference
      const name = mush.capstring(data[1].trim(), "title");
      stats = await getStats();
      for (const st of stats) {
        if (st.name === name) {
          stat = st;
        }
      }

      if (stat) {
        try {
          mush.stats.Stats.remove(stat._key);
          await mush.broadcast.send(
            socket,
            `%chDone.%cn Stat '%ch${stat.name}%cn' removed.`
          );
          mush.stats.stats.delete(name);
        } catch (error) {
          mush.log.error(error);
        }
      } else {
        mush.broadcast.send(socket, "That's not a valid stat.");
      }
    }
  });

  mush.cmds.set("@stat/models", {
    pattern: /^@?stat\/models/,
    restriction: "connected immortal|wizard|royalty",
    run: socket => {
      output = "[lheader(@stat/Models)]%r%r";
      const list = [];
      for (const model of mush.stats.models.keys()) {
        list.push(mush.capstring(model, "title"));
      }
      output += `[columns(${list.join(" ")},4)]%r%r`;
      output += "[footer()]";
      mush.broadcast.send(socket, output);
    }
  });
};
