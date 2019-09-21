const { find } = require("lodash");

module.exports = mush => {
  const getTarget = async (enactor, key) => {
    try {
      // The three possible combinations for target.  A dbref,
      // a number, or a name.
      let target;
      if (key[0] === "#") {
        target = await mush.db.key(key.slice(1));
      } else if (Number.isInteger(parseInt(key))) {
        target = await mush.db.key(key);
      } else {
        for (const item of enactor.contents) {
          const itemObj = await mush.db.key(item);
          if (key.toLowerCase() === itemObj.name.toLowerCase()) {
            target = await mush.db.key(item);
          }
        }
      }
      return target;
    } catch (error) {
      mush.log.error(error);
    }
  };

  const update = async ({
    socket,
    enactor,
    target,
    obj,
    singular,
    plural,
    err
  }) => {
    try {
      if (obj) {
        const curRoom = await mush.db.key(enactor.location);
        await mush.db.update(obj._key, { location: target._key });
        enactor.contents.splice(enactor.contents.indexOf(obj._key), 1);
        await mush.db.update(enactor._key, { contents: enactor.contents });
        target.contents = [...target.contents, obj._key];
        await mush.db.update(target._key, { contents: target.contents });

        singular.toLowerCase() === "give"
          ? mush.broadcast.send(
              socket,
              `You ${singular} %ch${
                obj.moniker ? obj.moniker : `%ch${obj.name}%cn`
              }%cn to ${
                target.moniker ? target.moniker : `%ch${target.name}%cn`
              }.`
            )
          : mush.broadcast.send(
              socket,
              `You ${singular} %ch${
                obj.moniker ? obj.moniker : `%ch${obj.name}%cn`
              }%cn.`
            );

        // if target isn't a room, broadcast to enactor's location.
        if (target.type === "room") {
          await mush.broadcast.sendList(
            socket,
            target.contents,
            singular.toLowerCase() === "give"
              ? `${
                  enactor.moniker ? enactor.moniker : `%ch${enactor.name}%cn`
                } ${plural} ${
                  obj.moniker ? obj.moniker : `%ch${obj.name}%cn`
                } to ${
                  target.moniker ? target.moniker : `%ch${target.name}%cn`
                }.`
              : `${
                  enactor.moniker ? enactor.moniker : `%ch${enactor.name}%cn`
                } ${obj.moniker ? obj.moniker : `%ch${obj.name}%cn`}`,
            "connected"
          );
        } else {
          if (singular.toLowerCase() === "give" && !target) {
            mush.broadcast.send(socket, err[1]);
          } else {
            await mush.broadcast.sendList(
              socket,
              curRoom.contents,
              singular.toLowerCase() === "give"
                ? `${
                    enactor.moniker ? enactor.moniker : `%ch${enactor.name}%cn`
                  } ${plural} ${
                    obj.moniker ? obj.moniker : `%ch${obj.name}%cn`
                  } to ${
                    target.moniker ? target.moniker : `%ch${target.name}%cn`
                  }.`
                : `${
                    enactor.moniker ? enactor.moniker : `%ch${enactor.name}%cn`
                  } ${plural} ${
                    obj.moniker ? obj.moniker : `%ch${obj.name}%cn`
                  }`,
              "connected"
            );
          }
        }
        // send an event about the action.
      } else {
        if (singular === "give") {
          mush.broadcast.send(socket, `${err[0]}`);
        } else {
          mush.broadcast.send(socket, `${err}`);
        }
      }
    } catch (error) {
      mush.log.error(error);
    }
  };

  mush.cmds.set("@create", {
    pattern: /^@create\s+(.*)/,
    restriction: "connected immortal|wizard|royalty|staff",
    run: async (socket, match) => {
      try {
        const enactor = await mush.db.key(socket._key);
        let object = await mush.db.insert({
          name: match[1].trim(),
          type: "thing",
          owner: socket._key,
          location: socket._key
        });
        object = await mush.db.key(object._key);
        enactor.contents = [...enactor.contents, object._key];
        await mush.db.update(socket._key, {
          contents: enactor.contents
        });
        mush.broadcast.send(
          socket,
          `%chDone%cn. Created object %ch${object.name}%cn.`
        );
        mush.emitter.emit("create", { enactor, object });
      } catch (error) {
        mush.log.error(error);
      }
    }
  });

  mush.cmds.set("drop", {
    pattern: /^drop\s+(.*)/i,
    restriction: "connected",
    run: async (socket, match) => {
      try {
        const [, name] = match;
        const enactor = await mush.db.key(socket._key);
        const target = await mush.db.key(enactor.location);
        const obj = await getTarget(enactor, name);
        await update({
          socket,
          enactor,
          target,
          obj,
          singular: "drop",
          plural: "drops",
          err: "You're not holding that."
        });
      } catch (error) {
        mush.log.error(error);
      }
    }
  });

  mush.cmds.set("get", {
    pattern: /^get\s+(.*)/,
    restriction: "connected",
    run: async (socket, data) => {
      const [, name] = data;
      const enactor = await mush.db.key(socket._key);
      const target = await mush.db.key(enactor.location);
      const obj = await getTarget(target, name);
      await update({
        socket,
        enactor: target,
        target: enactor,
        obj,
        singular: "get",
        plural: "gets",
        err: "I don't see that here."
      });
    }
  });

  mush.cmds.set("give", {
    pattern: /^give\s(.*)\s+to\s(.*)/,
    restriction: "connected",
    run: async (socket, data) => {
      try {
        const [, name, reciver] = data;
        const enactor = await mush.db.key(socket._key);
        const curRoom = await mush.db.key(enactor.location);
        const target = await getTarget(curRoom, reciver.trim());
        const obj = await getTarget(enactor, name.trim());
        if (target) {
          await update({
            socket,
            enactor,
            target,
            obj,
            singular: "give",
            plural: "gives",
            err: ["You're not holding that.", "I don't see that here"]
          });
        } else {
          mush.broadcast.send(socket, "I can't find that here.");
        }
      } catch (error) {
        log.error(error);
      }
    }
  });
};
